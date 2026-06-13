"""Pluggable audio layer — shared across robot apps (DJ Reactor and friends).

Mirrors `vision/`: a source turns the world into a normalized reading. Here an
`AudioSource` produces an `AudioFeatures` snapshot (bands, beat, tempo, energy)
that the dance controller consumes. Apps pick a source by config and never touch
the capture backend, the same way they pick a `Detector`.

`FFTBeatAnalyzer` (analyzer.py) is the pure signal-processing core — feed it raw
samples, get features back, no device required (so it's unit-testable). A source
(capture.py) owns a device and an analyzer; `SilentAudioSource` owns neither and
always reads silence, which keeps the app importable and HF-publishable on a
machine with no audio input.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass
class AudioFeatures:
    """One frame of analyzed audio, normalized across sources."""

    bass: float = 0.0          # 0..1, low-frequency energy
    mid: float = 0.0           # 0..1, mid-frequency energy
    treble: float = 0.0        # 0..1, high-frequency energy
    rms: float = 0.0           # 0..1, overall loudness
    beat_detected: bool = False
    onset_strength: float = 0.0  # how hard the latest onset hit (~0..2)
    bpm: float = 120.0
    beat_phase: float = 0.0    # 0..1 position within the current beat cycle
    is_silent: bool = True
    source: str = ""           # source name, for UI/telemetry

    def as_dict(self) -> dict[str, Any]:
        return {
            "bass": round(self.bass, 3),
            "mid": round(self.mid, 3),
            "treble": round(self.treble, 3),
            "rms": round(self.rms, 3),
            "beat": self.beat_detected,
            "onset": round(self.onset_strength, 3),
            "bpm": round(self.bpm, 1),
            "beat_phase": round(self.beat_phase, 3),
            "silent": self.is_silent,
            "source": self.source,
        }


@runtime_checkable
class AudioSource(Protocol):
    """A live source of `AudioFeatures`. Start it, poll `latest()`, stop it."""

    name: str

    @property
    def available(self) -> bool:
        """True if this source can actually capture (a device exists)."""

    def start(self) -> bool:
        """Begin capture. Returns success; safe to call when unavailable."""

    def stop(self) -> None:
        """Stop capture and free the device."""

    def latest(self) -> AudioFeatures:
        """Most recent analyzed frame (silent features before any audio)."""

    def set_sensitivity(self, value: float) -> None:
        """Adjust beat-detection sensitivity (0.2..1.0)."""


class SilentAudioSource:
    """Always-silent source — the no-device fallback.

    Lets the app run end to end (loop, UI, robot idle) on a machine with no
    microphone or loopback, so DJ Reactor stays importable and HF-publishable.
    The robot simply idles since every frame reads silent.
    """

    name = "silent"

    def __init__(self) -> None:
        self._features = AudioFeatures(source=self.name)

    @property
    def available(self) -> bool:
        return False

    def start(self) -> bool:
        return False

    def stop(self) -> None:
        pass

    def latest(self) -> AudioFeatures:
        return self._features

    def set_sensitivity(self, value: float) -> None:
        pass
