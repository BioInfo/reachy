"""Live microphone / loopback capture, feeding an `FFTBeatAnalyzer`.

`MicAudioSource` opens a sounddevice input stream and runs each block through the
analyzer in the audio callback, so `latest()` is always the most recent frame.
It degrades cleanly: if `sounddevice` isn't installed or the device won't open,
`available` is False and the factory falls back to silence instead of crashing
the app — important on headless / HF machines with no audio input.

To capture system audio (Spotify, a track playing on the machine) on macOS, route
output through a loopback device (e.g. BlackHole) and select it here; otherwise
this listens to the default microphone.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

import numpy as np

from .analyzer import FFTBeatAnalyzer
from .base import AudioFeatures

logger = logging.getLogger(__name__)

try:  # optional dep — absence just means "no live capture"
    import sounddevice as _sd
except Exception:  # noqa: BLE001
    _sd = None


def sounddevice_available() -> bool:
    return _sd is not None


def list_input_devices() -> list[dict[str, Any]]:
    """[{index, name}] of devices with input channels (empty if no backend)."""
    if _sd is None:
        return []
    out: list[dict[str, Any]] = []
    try:
        for i, dev in enumerate(_sd.query_devices()):
            if dev.get("max_input_channels", 0) > 0:
                out.append({"index": i, "name": dev.get("name", f"device {i}")})
    except Exception as e:  # noqa: BLE001
        logger.warning("could not query audio devices: %s", e)
    return out


class MicAudioSource:
    """Capture from an input device, analyzing in real time."""

    name = "mic"

    def __init__(
        self,
        *,
        device_index: Optional[int] = None,
        sample_rate: int = 44100,
        chunk_size: int = 2048,
        sensitivity: float = 0.6,
    ):
        self.device_index = device_index
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.analyzer = FFTBeatAnalyzer(
            sample_rate=sample_rate, chunk_size=chunk_size,
            sensitivity=sensitivity, source_name=self.name,
        )
        self._stream = None
        self._start_time = 0.0
        self._running = False

    @property
    def available(self) -> bool:
        return _sd is not None

    def start(self) -> bool:
        if self._running:
            return True
        if _sd is None:
            logger.warning("sounddevice unavailable; cannot start mic capture")
            return False
        try:
            self.analyzer.reset()
            self._start_time = time.monotonic()
            self._stream = _sd.InputStream(
                device=self.device_index,
                channels=1,
                samplerate=self.sample_rate,
                blocksize=self.chunk_size,
                callback=self._callback,
            )
            self._stream.start()
            self._running = True
            logger.info("mic capture started (device=%s)", self.device_index)
            return True
        except Exception as e:  # noqa: BLE001
            logger.warning("mic capture failed to start: %s", e)
            self._stream = None
            return False

    def stop(self) -> None:
        self._running = False
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception as e:  # noqa: BLE001
                logger.debug("mic stop error: %s", e)
            self._stream = None

    def latest(self) -> AudioFeatures:
        return self.analyzer.latest

    def set_sensitivity(self, value: float) -> None:
        self.analyzer.set_sensitivity(value)

    # -- audio thread ------------------------------------------------------

    def _callback(self, indata, frames, time_info, status) -> None:  # noqa: ANN001
        if status:
            logger.debug("audio status: %s", status)
        t = time.monotonic() - self._start_time
        try:
            self.analyzer.process(np.asarray(indata), t)
        except Exception as e:  # noqa: BLE001 — never crash the audio thread
            logger.debug("analyze error: %s", e)
