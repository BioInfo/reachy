"""Motion-presence detector — zero-dependency default for any app.

Frame-diff in a configurable ROI. This is *honest*: it reports presence
(is someone moving at the desk), not gaze or attention. v1 of Focus Guardian
dressed this up as "gaze detection" with unused yaw/pitch scaffolding; v2 calls
it what it is. For real attention, use VLMAttentionDetector.

All thresholds come from the constructor so an app's config drives behavior —
no magic numbers baked in.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np

from .base import AttentionResult, BaseDetector
from .frames import region_of_interest, to_blurred_gray, motion_fraction

logger = logging.getLogger(__name__)


class MotionPresenceDetector(BaseDetector):
    """Presence via frame-diff motion in an ROI, smoothed over a short window."""

    name = "motion"

    def __init__(
        self,
        *,
        roi_left: float = 0.0,
        roi_right: float = 1.0,
        roi_top: float = 0.0,
        roi_bottom: float = 1.0,
        motion_threshold: float = 0.003,
        smoothing_window: int = 10,
        still_grace_frames: int = 20,
        blur: int = 21,
        diff_threshold: int = 30,
    ):
        self.roi = (roi_left, roi_right, roi_top, roi_bottom)
        self.motion_threshold = motion_threshold
        self.smoothing_window = max(1, smoothing_window)
        self.still_grace_frames = max(0, still_grace_frames)
        self.blur = blur
        self.diff_threshold = diff_threshold
        self.reset()

    def reset(self) -> None:
        self._prev_gray: Optional[np.ndarray] = None
        self._history: list[float] = []
        self._consecutive_still = 0

    def detect(self, frame: np.ndarray) -> AttentionResult:
        try:
            roi = region_of_interest(frame, *self.roi)
            gray = to_blurred_gray(roi, self.blur)

            if self._prev_gray is None:
                self._prev_gray = gray
                return AttentionResult(True, True, 0.5, self.name, "starting")

            score = motion_fraction(self._prev_gray, gray, self.diff_threshold)
            self._prev_gray = gray

            self._history.append(score)
            if len(self._history) > self.smoothing_window:
                self._history.pop(0)
            avg = sum(self._history) / len(self._history)

            if avg > self.motion_threshold:
                self._consecutive_still = 0
                return AttentionResult(
                    present=True, engaged=True,
                    confidence=min(avg * 20, 1.0),
                    source=self.name, detail="active",
                    extra={"motion": avg},
                )

            self._consecutive_still += 1
            if self._consecutive_still < self.still_grace_frames:
                # brief stillness — treat as present, lower confidence
                return AttentionResult(True, True, 0.3, self.name, "still",
                                       extra={"motion": avg})
            return AttentionResult(False, False, 0.0, self.name, "away",
                                   extra={"motion": avg})
        except Exception as e:  # noqa: BLE001
            logger.debug("motion detect error: %s", e)
            return AttentionResult(True, True, 0.0, self.name, "error")
