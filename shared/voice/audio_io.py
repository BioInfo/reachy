"""Audio I/O — the robot's ears and mouth, abstracted.

The voice loop needs two things: a stream of microphone frames to feed the wake
word + VAD, and a way to push synthesized speech to the speaker. The SDK gives us
both through `mini.media` (gstreamer/webrtc under the hood); a `sounddevice`
fallback lets the whole pipeline run on a laptop with no robot attached, which is
how we develop and test it.

Both backends present the same small surface:

    start() / stop()            open/close the mic+speaker
    read() -> mono float32|None next captured chunk at `input_rate`, None if idle
    play(samples, samplerate)   speak through the speaker (blocking)

Mono float32 in [-1, 1] is the lingua franca; callers resample as they need
(`base.resample`). Everything degrades to "unavailable" instead of raising, so an
app stays importable when no audio device is present.
"""

from __future__ import annotations

import logging
import queue
import time
from typing import Any, Protocol, runtime_checkable

import numpy as np

from .base import resample

logger = logging.getLogger(__name__)


@runtime_checkable
class AudioIO(Protocol):
    """Mic + speaker for the voice loop."""

    name: str

    @property
    def available(self) -> bool: ...

    @property
    def input_rate(self) -> int:
        """Samplerate of frames returned by `read`."""

    @property
    def output_rate(self) -> int:
        """Samplerate the speaker expects in `play`."""

    def start(self) -> None: ...
    def stop(self) -> None: ...

    def read(self) -> np.ndarray | None:
        """Next mono float32 chunk from the mic, or None if nothing is ready yet."""

    def play(self, samples: np.ndarray, samplerate: int) -> None:
        """Play mono float32 samples through the speaker (resampled to output_rate)."""

    def flush_input(self) -> None:
        """Drop any buffered mic audio (e.g. the robot's own speech it just heard)."""


def _to_mono(samples: np.ndarray) -> np.ndarray:
    """Collapse (N, C) -> (N,) by channel mean; pass (N,) through."""
    a = np.asarray(samples, dtype=np.float32)
    if a.ndim > 1:
        a = a.mean(axis=1)
    return a


class RobotAudioIO:
    """Mic + speaker via the Reachy Mini SDK (`mini.media`).

    `get_audio_sample()` returns (N, 2) stereo float32 (or None); we collapse to
    mono. Playback pushes mono float32 in chunks after resampling to the speaker's
    rate, exactly like the SDK's `sound_play` example.
    """

    name = "robot"

    def __init__(self, robot: Any, *, play_chunk: int = 1024):
        self._robot = robot
        self._play_chunk = play_chunk
        self._recording = False
        self._playing = False
        self._in_rate = 0
        self._out_rate = 0

    @property
    def _media(self) -> Any:
        return getattr(self._robot, "media", None)

    @property
    def available(self) -> bool:
        return self._media is not None

    @property
    def input_rate(self) -> int:
        if not self._in_rate and self.available:
            try:
                self._in_rate = int(self._media.get_input_audio_samplerate())
            except Exception:  # noqa: BLE001
                self._in_rate = 16000
        return self._in_rate or 16000

    @property
    def output_rate(self) -> int:
        if not self._out_rate and self.available:
            try:
                self._out_rate = int(self._media.get_output_audio_samplerate())
            except Exception:  # noqa: BLE001
                self._out_rate = 24000
        return self._out_rate or 24000

    def start(self) -> None:
        if not self.available or self._recording:
            return
        try:
            self._media.start_recording()
            self._recording = True
        except Exception as exc:  # noqa: BLE001
            logger.warning("RobotAudioIO start_recording failed: %s", exc)

    def stop(self) -> None:
        if not self.available:
            return
        for fn, flag in (("stop_recording", "_recording"), ("stop_playing", "_playing")):
            if getattr(self, flag):
                try:
                    getattr(self._media, fn)()
                except Exception:  # noqa: BLE001
                    pass
                setattr(self, flag, False)

    def read(self) -> np.ndarray | None:
        if not self.available:
            return None
        try:
            sample = self._media.get_audio_sample()
        except Exception:  # noqa: BLE001
            return None
        if sample is None:
            return None
        return _to_mono(sample)

    def flush_input(self) -> None:
        """Drain whatever the mic captured during playback (the robot has its own
        echo handling, but draining keeps the next turn from re-hearing the tail)."""
        if not self.available:
            return
        for _ in range(50):
            try:
                if self._media.get_audio_sample() is None:
                    break
            except Exception:  # noqa: BLE001
                break

    def play(self, samples: np.ndarray, samplerate: int) -> None:
        if not self.available or samples is None or len(samples) == 0:
            return
        data = _to_mono(samples)
        data = resample(data, samplerate, self.output_rate)
        try:
            self._media.start_playing()
            self._playing = True
            for i in range(0, len(data), self._play_chunk):
                self._media.push_audio_sample(data[i : i + self._play_chunk])
            # let the buffer drain before we stop the stream
            time.sleep(min(2.0, len(data) / float(self.output_rate) + 0.3))
            self._media.stop_playing()
            self._playing = False
        except Exception as exc:  # noqa: BLE001
            logger.warning("RobotAudioIO play failed: %s", exc)


class LocalAudioIO:
    """Mic + speaker via `sounddevice` — the no-robot development path.

    A continuous input stream feeds a bounded queue; `read` pops the next block.
    Playback uses a blocking write so the loop knows when speech is finished.
    """

    name = "local"

    def __init__(
        self,
        *,
        input_rate: int = 16000,
        output_rate: int = 24000,
        block: int = 1600,
        input_device: int | None = None,
        output_device: int | None = None,
    ):
        self._in_rate = input_rate
        self._out_rate = output_rate
        self._block = block
        self._input_device = input_device
        self._output_device = output_device
        self._sd: Any = None
        self._stream: Any = None
        self._q: queue.Queue[np.ndarray] = queue.Queue(maxsize=64)

    @property
    def available(self) -> bool:
        try:
            import sounddevice  # noqa: F401
        except Exception:  # noqa: BLE001
            return False
        return True

    @property
    def input_rate(self) -> int:
        return self._in_rate

    @property
    def output_rate(self) -> int:
        return self._out_rate

    def _ensure_sd(self) -> Any:
        if self._sd is None:
            import sounddevice as sd

            self._sd = sd
        return self._sd

    def _callback(self, indata, frames, time_info, status):  # noqa: ANN001
        if status:
            logger.debug("sounddevice input status: %s", status)
        try:
            self._q.put_nowait(_to_mono(indata).copy())
        except queue.Full:
            pass  # drop a block rather than block the audio thread

    def start(self) -> None:
        if self._stream is not None:
            return
        try:
            sd = self._ensure_sd()
            self._stream = sd.InputStream(
                samplerate=self._in_rate,
                channels=1,
                blocksize=self._block,
                dtype="float32",
                device=self._input_device,
                callback=self._callback,
            )
            self._stream.start()
        except Exception as exc:  # noqa: BLE001
            logger.warning("LocalAudioIO start failed: %s", exc)
            self._stream = None

    def stop(self) -> None:
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception:  # noqa: BLE001
                pass
            self._stream = None
        with self._q.mutex:
            self._q.queue.clear()

    def read(self) -> np.ndarray | None:
        try:
            return self._q.get(timeout=0.1)
        except queue.Empty:
            return None

    def flush_input(self) -> None:
        """Clear the mic queue — call right after playback so the loop doesn't
        transcribe the speaker output it just buffered (laptop has no echo cancel)."""
        with self._q.mutex:
            self._q.queue.clear()

    def play(self, samples: np.ndarray, samplerate: int) -> None:
        if samples is None or len(samples) == 0:
            return
        data = _to_mono(samples)
        data = resample(data, samplerate, self._out_rate)
        try:
            sd = self._ensure_sd()
            sd.play(data, self._out_rate, device=self._output_device)
            sd.wait()
        except Exception as exc:  # noqa: BLE001
            logger.warning("LocalAudioIO play failed: %s", exc)
