"""Pluggable detection layer — shared across all robot apps.

A `Detector` turns a camera frame into an `AttentionResult` (is a person
present, are they engaged, how sure). Apps pick a detector by config and never
care about the implementation, the same way Cardinal's agent picks a `Brain`.
Concrete detectors live alongside this file (motion.py, vlm.py); apps add their
own by implementing the protocol.

This is deliberately separate from `vision/detector.py`'s object/bbox
detection — that answers "what objects are in frame", this answers "is the user
present and engaged". An app can use both.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

import numpy as np


@dataclass
class AttentionResult:
    """A detector's read on the user, normalized across implementations."""

    present: bool          # is a person at the desk at all
    engaged: bool          # are they attending to their work (vs looked away)
    confidence: float = 0.5  # 0..1 — how sure the detector is
    source: str = ""       # detector name, for UI/telemetry
    detail: str = ""       # short human label ("typing", "looked away", "no face")
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def focused(self) -> bool:
        """Convenience: present AND engaged."""
        return self.present and self.engaged


@runtime_checkable
class Detector(Protocol):
    """Frame -> AttentionResult. Stateful detectors keep history internally."""

    name: str

    def detect(self, frame: np.ndarray) -> AttentionResult:
        """Analyze one BGR frame."""
        ...

    def reset(self) -> None:
        """Clear any internal state (called on session start)."""
        ...

    def release(self) -> None:
        """Free resources (models, buffers)."""
        ...


class BaseDetector:
    """Optional base with no-op lifecycle, so detectors only implement detect()."""

    name: str = "base"

    def reset(self) -> None:  # noqa: D102
        pass

    def release(self) -> None:  # noqa: D102
        pass
