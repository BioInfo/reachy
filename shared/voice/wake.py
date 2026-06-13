"""Wake word — "Hey Echo" before the robot starts a turn.

Always-listening with a wake word keeps the loop cheap (no STT/LLM until you call
it) and natural (no button). Three backends behind one `WakeWord` protocol:

- `PorcupineWake` — Picovoice Porcupine, the primary. Needs a free AccessKey and a
  custom "Hey Echo" `.ppn`; tiny, on-device, very low false-accept. Frames are 512
  samples @ 16 kHz.
- `OpenWakeWord` — keyless fallback so the loop runs before the Picovoice key
  exists. Frames are 1280 samples @ 16 kHz; trigger on score over a threshold.
- `AlwaysWake` — no gate at all: every frame "triggers", so the loop records and
  responds continuously. The zero-dependency default for a quick desk demo.

The pipeline resamples the mic to 16 kHz and feeds frames of `frame_length`; each
backend reports its expected `sample_rate` and `frame_length`. Anything missing a
dependency or key reports `available = False` and the factory falls back.
"""

from __future__ import annotations

import logging

import numpy as np

from .base import STT_SAMPLE_RATE, to_int16

logger = logging.getLogger(__name__)


class PorcupineWake:
    """Picovoice Porcupine wake word ("Hey Echo" via a custom .ppn)."""

    name = "porcupine"

    def __init__(
        self,
        access_key: str = "",
        keyword_path: str = "",
        *,
        builtin_keyword: str = "",
        sensitivity: float = 0.6,
    ):
        self._handle = None
        self._sample_rate = STT_SAMPLE_RATE
        self._frame_length = 512
        if not access_key:
            return
        try:
            import pvporcupine

            kwargs: dict = {"access_key": access_key, "sensitivities": [sensitivity]}
            if keyword_path:
                kwargs["keyword_paths"] = [keyword_path]
            elif builtin_keyword:
                kwargs["keywords"] = [builtin_keyword]
            else:
                return  # nothing to listen for
            self._handle = pvporcupine.create(**kwargs)
            self._sample_rate = self._handle.sample_rate
            self._frame_length = self._handle.frame_length
        except Exception as exc:  # noqa: BLE001
            logger.warning("Porcupine init failed (%s) — wake word disabled", exc)
            self._handle = None

    @property
    def available(self) -> bool:
        return self._handle is not None

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    @property
    def frame_length(self) -> int:
        return self._frame_length

    def process(self, frame: np.ndarray) -> bool:
        if self._handle is None:
            return False
        try:
            return self._handle.process(to_int16(frame)) >= 0
        except Exception:  # noqa: BLE001
            return False

    def reset(self) -> None:
        return  # Porcupine is stateless across triggers


class OpenWakeWord:
    """Keyless wake word (openWakeWord) — fallback until the Picovoice key lands."""

    name = "openwakeword"

    def __init__(self, *, model: str = "hey_jarvis", threshold: float = 0.5):
        self._model = None
        self._threshold = threshold
        self._frame_length = 1280  # openWakeWord expects 80 ms @ 16 kHz
        try:
            from openwakeword.model import Model

            self._model = Model(wakeword_models=[model]) if model else Model()
        except Exception as exc:  # noqa: BLE001
            logger.info("openWakeWord unavailable (%s)", exc)
            self._model = None

    @property
    def available(self) -> bool:
        return self._model is not None

    @property
    def sample_rate(self) -> int:
        return STT_SAMPLE_RATE

    @property
    def frame_length(self) -> int:
        return self._frame_length

    def process(self, frame: np.ndarray) -> bool:
        if self._model is None:
            return False
        try:
            scores = self._model.predict(to_int16(frame))
            return any(v >= self._threshold for v in scores.values())
        except Exception:  # noqa: BLE001
            return False

    def reset(self) -> None:
        if self._model is not None:
            try:
                self._model.reset()
            except Exception:  # noqa: BLE001
                pass


class AlwaysWake:
    """No wake gate: every frame triggers. Zero-dep default for a desk demo."""

    name = "always"
    available = True
    sample_rate = STT_SAMPLE_RATE
    frame_length = 512

    def process(self, frame: np.ndarray) -> bool:  # noqa: ARG002
        return True

    def reset(self) -> None:
        return
