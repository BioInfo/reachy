"""Hey, Reachy — orchestrator for a spoken-conversation companion on Reachy Mini.

Composes the reusable parts: `shared.voice.VoiceLoop` (ears + mouth) + a
`ConversationManager` over a pluggable `Brain` (the engine) + `shared`
`EmotionFeedback` (the reactions) + `shared.app.AppServer` (UI/API/WS). The robot's
*reaction* is the product; the LLM is the engine.

Concurrency model (the important part):
- The **VoiceLoop** runs its own thread. It owns the audio link (mic + speaker via
  `RobotAudioIO`) and calls `respond()` (the brain turn, inline) and `on_event()`
  (fast, no robot — just stashes state and queues a reaction).
- The **control loop** runs in `run()` (the thread the daemon hands us). It is the
  ONLY place that drives robot *motion*, so gestures are serialized. It drains the
  reaction queue and plays emotions — but **never while Reachy is speaking**: the
  speaker owns that beat, and a move must not compete with audio over the media
  link. Motion happens around speech (wake / listen / think / settle), not during.
- Commands (say/stop/config) just enqueue an intent the control loop drains.

`request_media_backend` defaults to "default" so the robot's audio is live. Set
`HEY_REACHY_MEDIA_BACKEND=no_media` (or `HEY_REACHY_VOICE=0`) to run mute/idle.
"""

from __future__ import annotations

import logging
import math
import re
import threading
import time
from pathlib import Path
from typing import Any, Optional

from reachy_mini import ReachyMini, ReachyMiniApp
from reachy_mini.utils import create_head_pose

from ._bootstrap import ensure_shared_importable

ensure_shared_importable()

from shared.app.server import AppServer  # noqa: E402
from shared.brain import build_brain  # noqa: E402
from shared.reachy_utils import safe_goto  # noqa: E402
from shared.voice import (  # noqa: E402
    RobotAudioIO,
    VoiceLoop,
    VoiceState,
    build_stt,
    build_tts,
    build_vad,
    build_wake,
)

from .config import HeyReachyConfig  # noqa: E402
from .conversation import ConversationManager  # noqa: E402

logger = logging.getLogger(__name__)

_WEB_DIR = Path(__file__).resolve().parent / "web"

# A gentle "talking" head-nod. Reachy should be CALM — she holds still while
# listening/thinking/idle (no fidgeting) and only nods softly WHILE speaking.
# Head-only, no antennas (antennas are the self-collision risk), small amplitude.
_NOD_AMPLITUDE_DEG = 3.5    # peak pitch of the nod (small)
_NOD_HZ = 0.9              # slow, calm nods per second
_NOD_SEND_PERIOD_S = 0.33  # re-target at most ~3x/s (don't hammer the motors)

# Strip roleplay stage directions the model might emit (*tilts head*, (smiles)) —
# the TTS would otherwise SPEAK them aloud. The persona forbids these; this is the
# safety net.
_ACTION_RE = re.compile(r"\*[^*]*\*|\([^)]{0,40}\)")


def _spoken_only(text: str) -> str:
    return re.sub(r"\s{2,}", " ", _ACTION_RE.sub("", text)).strip()


# Whisper hallucinates these on ambient silence; never treat them as a real turn.
_STT_NOISE = {
    "", ".", "you", "you.", "thank you", "thank you.", "thanks", "bye", "bye.",
    "thanks for watching", "thanks for watching!", "yeah", "uh", "um", "hmm",
    "okay", "ok", ".", "..", "...", "so", "the",
}


class ReachyMiniHeyReachy(ReachyMiniApp):
    """A small desk robot you talk to. Wake → listen → think → speak → react."""

    custom_app_url: str | None = None
    dont_start_webserver: bool = True
    request_media_backend: str | None = "default"  # robot audio in/out

    def __init__(self, config: Optional[HeyReachyConfig] = None):
        super().__init__()
        self.cfg = config or HeyReachyConfig.from_env()
        self.custom_app_url = f"http://localhost:{self.cfg.ui_port}"
        # honour a configured backend (e.g. no_media) over the class default
        self.media_backend = self.cfg.media_backend

        self.brain = build_brain(self.cfg.brain_spec())
        self.conversation = ConversationManager(self.brain, max_history=self.cfg.max_history)

        self._lock = threading.Lock()
        self._intents: list[tuple[str, dict[str, Any]]] = []
        self._voice_state = VoiceState.STOPPED.value
        self._last_transcript = ""
        self._last_reply = ""
        self._robot_label = "idle"
        self._turns = 0
        self._nod_t0 = 0.0          # speaking-nod phase origin
        self._last_nod_send = 0.0   # throttle for nod re-targeting
        self._neutral_held = False  # have we settled to neutral since speaking ended?
        self.loop: VoiceLoop | None = None

        self.server = AppServer(
            self.cfg.app_name, self._snapshot,
            web_dir=_WEB_DIR, host="127.0.0.1", port=self.cfg.ui_port,
            push_interval_s=self.cfg.tick_interval_s,
        )
        self.server.register_command("say", self._cmd_say)
        self.server.register_command("stop_voice", self._cmd_stop_voice)
        self.server.register_command("start_voice", self._cmd_start_voice)
        self.server.register_command("config", self._cmd_config)

    # -- the brain turn (called inline by the VoiceLoop) -------------------

    def _respond(self, text: str) -> str:
        """Run one conversation turn; return the spoken reply text.

        Ignores whisper's silence-hallucinations so ambient noise never triggers a
        reply (Reachy is always-listening with no wake word yet)."""
        if text.strip().lower() in _STT_NOISE or len(text.strip()) < 3:
            logger.info("ignoring noise transcript: %r", text)
            return ""
        _, prior = self.conversation.begin(text)
        reply = self.conversation.run(text, prior)
        spoken, _ = self.conversation.settle(reply)
        self.conversation.session.to_idle()
        spoken = _spoken_only(spoken)
        with self._lock:
            self._last_reply = spoken
            self._turns += 1
        return spoken

    def _on_voice_event(self, event: str, payload: dict) -> None:
        """Fast, robot-free: just stash state. Motion is driven by the control loop."""
        if event in ("wake", "transcript", "error"):
            logger.info("voice event: %s %s", event, payload.get("text") or payload.get("error") or "")
        with self._lock:
            if event in (s.value for s in VoiceState):
                self._voice_state = event
            if event == "transcript":
                self._last_transcript = payload.get("text", "")

    # -- commands (server thread; enqueue only) ---------------------------

    def _cmd_say(self, body: dict[str, Any]) -> dict[str, Any]:
        """Gated inbound 'speak this' (reserved for the Pulsar push, Phase 3)."""
        if not self.cfg.inbound_enabled:
            return {"error": "inbound disabled (set HEY_REACHY_INBOUND_TOKEN)"}
        if (body or {}).get("token") != self.cfg.inbound_token:
            return {"error": "unauthorized"}
        text = (body or {}).get("text", "").strip()
        if not text:
            return {"error": "empty text"}
        with self._lock:
            self._intents.append(("say", {"text": text}))
        return {"queued": "say"}

    def _cmd_stop_voice(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("stop_voice", {}))
        return {"queued": "stop_voice"}

    def _cmd_start_voice(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("start_voice", {}))
        return {"queued": "start_voice"}

    def _cmd_config(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.cfg.apply_overrides(**(body or {}))
        return self.cfg.public_dict()

    # -- snapshot for UI ---------------------------------------------------

    def _snapshot(self) -> dict[str, Any]:
        with self._lock:
            status = self.loop.status() if self.loop else {}
            return {
                "voice_state": self._voice_state,
                "running": bool(self.loop and self.loop.running),
                "can_hear": status.get("can_hear", False),
                "can_speak": status.get("can_speak", False),
                "wake": status.get("wake", "?"),
                "stt": status.get("stt", "?"),
                "tts": status.get("tts", "?"),
                "audio": status.get("audio", "?"),
                "brain_available": self.brain.available,
                "last_transcript": self._last_transcript,
                "last_reply": self._last_reply,
                "turns": self._turns,
                "robot": self._robot_label,
                "config": self.cfg.public_dict(),
            }

    # -- control loop (owns all robot motion) -----------------------------

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        self.server.start_in_thread()

        self._tts_for_say = None
        self._audio_for_say = None
        if self.cfg.voice_enabled and self.media_backend != "no_media":
            audio = RobotAudioIO(reachy_mini)
            wake = build_wake(self.cfg.wake_spec())
            self.loop = VoiceLoop(
                audio,
                respond=self._respond,
                wake=wake,
                vad=build_vad(self.cfg.vad_spec()),
                stt=build_stt(self.cfg.stt_spec()),
                tts=build_tts(self.cfg.tts_spec()),
                on_event=self._on_voice_event,
                listen_timeout_s=self.cfg.listen_timeout_s,
                follow_up_timeout_s=self.cfg.follow_up_timeout_s,
            )
            self._tts_for_say = self.loop.tts
            self._audio_for_say = audio
            logger.info("voice: %s", self.loop.status())
            # No real wake word + require_wake -> stay calm instead of always-listening
            # (always-listening with no wake word self-triggers on ambient + own voice).
            if self.cfg.require_wake and wake.name == "always":
                logger.warning(
                    "no wake word configured (wake=always) and require_wake=True -> "
                    "NOT auto-listening. Set HEY_REACHY_PORCUPINE_KEY (+ HEY_REACHY_PORCUPINE_BUILTIN) "
                    "for a wake word, or POST /api/cmd/start_voice to listen anyway."
                )
            else:
                self.loop.start()
        else:
            logger.info("voice disabled (voice_enabled=%s, media=%s)",
                        self.cfg.voice_enabled, self.media_backend)

        self._go_neutral(reachy_mini)  # settle to a calm, level pose

        while not stop_event.is_set():
            self._drain_intents(reachy_mini)

            with self._lock:
                speaking = self._voice_state == VoiceState.SPEAKING.value

            # Motion ONLY while speaking: a gentle silent head-nod. Otherwise she
            # holds a calm neutral pose — no fidgeting while listening/thinking/idle.
            if speaking:
                self._talk_nod(reachy_mini)
                self._neutral_held = False
            elif not self._neutral_held:
                self._go_neutral(reachy_mini)
                self._neutral_held = True

            time.sleep(self.cfg.tick_interval_s)

        if self.loop is not None:
            self.loop.stop()
        self._go_neutral(reachy_mini)
        self.server.stop()

    def _drain_intents(self, robot: ReachyMini) -> None:
        with self._lock:
            intents, self._intents = self._intents, []
        for name, body in intents:
            if name == "say":
                self._say(robot, body.get("text", ""))
            elif name == "stop_voice":
                if self.loop is not None:
                    self.loop.stop()
            elif name == "start_voice":
                if self.loop is not None and not self.loop.running:
                    self.loop.start()

    def _say(self, robot: ReachyMini, text: str) -> None:
        """Speak an out-of-band line (the gated inbound channel)."""
        if not text or self._tts_for_say is None or self._audio_for_say is None:
            return
        try:
            samples, rate = self._tts_for_say.synth(text)
            if len(samples) > 0:
                with self._lock:
                    self._voice_state = VoiceState.SPEAKING.value
                    self._last_reply = text
                self._audio_for_say.play(samples, rate)
                with self._lock:
                    self._voice_state = VoiceState.WAITING.value
        except Exception as e:  # noqa: BLE001
            logger.debug("say failed: %s", e)

    def _talk_nod(self, robot: ReachyMini) -> None:
        """A small, slow, silent head-nod while speaking. Antennas pinned to zero
        (they're the twitch/self-collision risk); throttled so we don't hammer the
        motors with overlapping goto targets."""
        now = time.monotonic()
        if self._nod_t0 == 0.0:
            self._nod_t0 = now
            self._last_nod_send = 0.0
        if now - self._last_nod_send < _NOD_SEND_PERIOD_S:
            return
        self._last_nod_send = now
        t = now - self._nod_t0
        pitch = _NOD_AMPLITUDE_DEG * math.sin(2 * math.pi * _NOD_HZ * t)
        safe_goto(
            robot,
            head=create_head_pose(pitch=pitch, degrees=True),
            antennas=[0.0, 0.0],          # hold antennas still
            body_yaw=0.0,
            duration=_NOD_SEND_PERIOD_S,  # match the send period -> smooth, no overlap
            method="minjerk",
            what="talk_nod",
        )
        with self._lock:
            self._robot_label = "speaking"

    def _go_neutral(self, robot: ReachyMini) -> None:
        """Settle to a calm, level pose (no antenna motion)."""
        self._nod_t0 = 0.0
        safe_goto(
            robot,
            head=create_head_pose(),
            antennas=[0.0, 0.0],
            body_yaw=0.0,
            duration=0.5,
            method="minjerk",
            what="neutral",
        )
        with self._lock:
            self._robot_label = "idle"


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    app = ReachyMiniHeyReachy()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()


if __name__ == "__main__":
    main()
