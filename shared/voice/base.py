"""Pluggable voice layer — shared across robot apps (Echo and friends).

The conversation core (`shared.brain`) is text-in/text-out. This layer wraps it
with ears and a mouth so you can talk to the robot and it talks back:

    wake word -> record (VAD) -> STT -> [brain] -> TTS -> robot speaks

Each piece is a small protocol with a graceful, dependency-light fallback, the
same shape as `audio/` and `vision/`: a `TTSEngine` turns text into samples, an
`STTEngine` turns samples into text, a `WakeWord` watches a mic stream for a
trigger, and an `AudioIO` (audio_io.py) abstracts the robot's mic/speaker vs a
local sound device. The `VoiceLoop` (pipeline.py) wires them together.

Everything degrades to "unavailable" instead of raising, so an app stays
importable and its text path keeps working when a voice backend is missing.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable

import numpy as np

# Whisper and most STT expect 16 kHz mono float32; we standardize on it internally.
STT_SAMPLE_RATE = 16000


@dataclass
class Utterance:
    """One captured spoken turn after STT."""

    text: str = ""
    ok: bool = True
    error: str = ""


@runtime_checkable
class TTSEngine(Protocol):
    """Text -> speech samples."""

    name: str

    @property
    def available(self) -> bool: ...

    def synth(self, text: str) -> tuple[np.ndarray, int]:
        """Return (mono float32 samples in [-1,1], samplerate). Empty array on failure."""


@runtime_checkable
class STTEngine(Protocol):
    """Speech samples -> text."""

    name: str

    @property
    def available(self) -> bool: ...

    def transcribe(self, samples: np.ndarray, samplerate: int) -> str:
        """Transcribe mono float32 samples. Returns "" on silence/failure."""


@runtime_checkable
class WakeWord(Protocol):
    """Watches a mono mic stream for a trigger phrase."""

    name: str

    @property
    def available(self) -> bool: ...

    @property
    def sample_rate(self) -> int:
        """Expected input samplerate for `process` frames."""

    @property
    def frame_length(self) -> int:
        """Number of samples per `process` frame."""

    def process(self, frame: np.ndarray) -> bool:
        """Feed one frame of `frame_length` int16/float32 samples. True on trigger."""

    def reset(self) -> None:
        """Clear internal state (after a trigger is consumed)."""


def to_int16(samples: np.ndarray) -> np.ndarray:
    """float32 [-1,1] -> int16, the format Porcupine/webrtcvad expect."""
    s = np.clip(samples, -1.0, 1.0)
    return (s * 32767.0).astype(np.int16)


def resample(samples: np.ndarray, src_sr: int, dst_sr: int) -> np.ndarray:
    """Mono float32 resample. Uses scipy if present, else linear interpolation."""
    if src_sr == dst_sr or samples.size == 0:
        return samples.astype(np.float32)
    n = int(round(samples.shape[0] * dst_sr / src_sr))
    try:
        from scipy.signal import resample as _r

        return _r(samples, n).astype(np.float32)
    except Exception:  # noqa: BLE001
        x_old = np.linspace(0.0, 1.0, samples.shape[0], endpoint=False)
        x_new = np.linspace(0.0, 1.0, n, endpoint=False)
        return np.interp(x_new, x_old, samples).astype(np.float32)
