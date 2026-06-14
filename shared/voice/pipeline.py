"""VoiceLoop — the conductor that turns ears + a brain + a mouth into a turn.

It runs the spoken-conversation loop in a background thread and emits state events
the app reacts to (so the robot can look alert when waking, tilt while listening,
settle while thinking, and gesture while speaking). The brain itself is injected
as a `respond(text) -> str` callback — the loop knows nothing about LLMs, exactly
like `ConversationManager` owns the brain and the loop owns the robot.

One turn:

    WAITING  -> wake word fires
    LISTENING-> VAD records until trailing silence
    (STT)    -> text; empty -> back to WAITING
    THINKING -> respond(text) (run inline; the app already threads the loop)
    SPEAKING -> TTS -> audio_io.play
    -> WAITING

Every backend degrades to a no-op, so the loop is safe to start even when a piece
is unavailable — it just won't hear or won't speak, and says so via `status`.
"""

from __future__ import annotations

import logging
import threading
import time
from enum import Enum
from typing import Callable

import numpy as np

from .audio_io import AudioIO
from .base import STTEngine, TTSEngine, WakeWord, resample
from .stt import NullSTT
from .tts import SilentTTS
from .vad import VADSegmenter
from .wake import AlwaysWake

logger = logging.getLogger(__name__)

EventHandler = Callable[[str, dict], None]
Responder = Callable[[str], str]


class VoiceState(str, Enum):
    STOPPED = "stopped"
    WAITING = "waiting"      # listening for the wake word
    LISTENING = "listening"  # recording a turn (VAD)
    THINKING = "thinking"    # brain is answering
    SPEAKING = "speaking"    # playing the reply


class VoiceLoop:
    """Wires audio I/O + wake + VAD + STT + TTS + a responder into a spoken loop."""

    def __init__(
        self,
        audio: AudioIO,
        respond: Responder,
        *,
        wake: WakeWord | None = None,
        vad: VADSegmenter | None = None,
        stt: STTEngine | None = None,
        tts: TTSEngine | None = None,
        on_event: EventHandler | None = None,
        listen_timeout_s: float = 10.0,
        follow_up_timeout_s: float = 8.0,
    ):
        self.audio = audio
        self._respond = respond
        self.wake = wake or AlwaysWake()
        self.vad = vad or VADSegmenter()
        self.stt = stt or NullSTT()
        self.tts = tts or SilentTTS()
        self._on_event = on_event
        self.listen_timeout_s = listen_timeout_s
        self.follow_up_timeout_s = follow_up_timeout_s

        self.state = VoiceState.STOPPED
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._wake_buf = np.zeros(0, dtype=np.float32)

    # -- lifecycle ---------------------------------------------------------

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def status(self) -> dict:
        return {
            "state": self.state.value,
            "audio": getattr(self.audio, "name", "?") if self.audio.available else "unavailable",
            "wake": self.wake.name if self.wake.available else "unavailable",
            "stt": self.stt.name if self.stt.available else "unavailable",
            "tts": self.tts.name if self.tts.available else "unavailable",
            "can_hear": self.audio.available and self.stt.available,
            "can_speak": self.audio.available and self.tts.available,
        }

    def start(self) -> None:
        if self.running:
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name="voice-loop", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=3.0)
        self._thread = None
        try:
            self.audio.stop()
        except Exception:  # noqa: BLE001
            pass
        self._set(VoiceState.STOPPED)

    # -- internals ---------------------------------------------------------

    def _set(self, state: VoiceState, **payload) -> None:
        self.state = state
        self._emit(state.value, **payload)

    def _emit(self, event: str, **payload) -> None:
        if self._on_event is not None:
            try:
                self._on_event(event, payload)
            except Exception:  # noqa: BLE001
                logger.debug("voice event handler raised", exc_info=True)

    def _run(self) -> None:
        try:
            self.audio.start()
        except Exception as exc:  # noqa: BLE001
            self._emit("error", error=f"audio start failed: {exc}")
            return
        self._set(VoiceState.WAITING)
        try:
            while not self._stop.is_set():
                if self._wait_for_wake():
                    self._converse()
                    self._set(VoiceState.WAITING)
        finally:
            self.audio.stop()
            self._set(VoiceState.STOPPED)

    def _wake_frames(self, chunk: np.ndarray):
        """Resample a mic chunk to the wake rate and yield exact wake frames."""
        s = resample(chunk, self.audio.input_rate, self.wake.sample_rate)
        self._wake_buf = np.concatenate([self._wake_buf, s]) if self._wake_buf.size else s
        flen = self.wake.frame_length
        n = (len(self._wake_buf) // flen) * flen
        frames, self._wake_buf = self._wake_buf[:n], self._wake_buf[n:]
        for i in range(0, n, flen):
            yield frames[i : i + flen]

    def _wait_for_wake(self) -> bool:
        self.wake.reset()
        self._wake_buf = np.zeros(0, dtype=np.float32)
        while not self._stop.is_set():
            chunk = self.audio.read()
            if chunk is None:
                continue
            for frame in self._wake_frames(chunk):
                if self.wake.process(frame):
                    self._emit("wake")
                    return True
        return False

    def _converse(self) -> None:
        """After the wake word, keep taking turns WITHOUT re-waking until the user
        goes quiet — so it's a conversation, not one-shot-per-wake. The first turn
        waits `listen_timeout_s`; follow-ups wait the shorter `follow_up_timeout_s`.
        Ends on a silent listen (no utterance) or two no-reply (noise) turns."""
        first = True
        empty = 0
        while not self._stop.is_set():
            timeout = self.listen_timeout_s if first else self.follow_up_timeout_s
            first = False
            text = self._listen(timeout)
            if not text:
                return  # silence -> conversation over, back to waiting for the wake word
            self._emit("transcript", text=text)
            self._set(VoiceState.THINKING)
            try:
                reply = self._respond(text) or ""
            except Exception as exc:  # noqa: BLE001
                self._emit("error", error=f"respond failed: {exc}")
                reply = ""
            if reply:
                self._speak(reply)
                empty = 0
            else:
                empty += 1
                if empty >= 2:  # two noise-only turns -> give up, require the wake word
                    return

    def _listen(self, timeout_s: float | None = None) -> str:
        self.vad.reset()
        self._set(VoiceState.LISTENING)
        limit = self.listen_timeout_s if timeout_s is None else timeout_s
        t0 = time.monotonic()
        utt: np.ndarray | None = None
        while not self._stop.is_set() and time.monotonic() - t0 < limit:
            chunk = self.audio.read()
            if chunk is None:
                continue
            utt = self.vad.push(chunk, self.audio.input_rate)
            if utt is not None:
                break
        if utt is None or len(utt) == 0:
            return ""
        from .base import STT_SAMPLE_RATE

        return self.stt.transcribe(utt, STT_SAMPLE_RATE)

    def _speak(self, text: str) -> None:
        self._set(VoiceState.SPEAKING, text=text)
        samples, rate = self.tts.synth(text)
        if samples is not None and len(samples) > 0:
            self.audio.play(samples, rate)
        # drop any mic audio captured during playback so we don't hear ourselves
        getattr(self.audio, "flush_input", lambda: None)()
        self._emit("speaking_end", text=text)
