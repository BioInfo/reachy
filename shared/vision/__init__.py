"""Shared vision utilities for Reachy Mini apps.

Two layers:
- **Attention** (present + engaged): `Detector` protocol + `AttentionResult`,
  with `MotionPresenceDetector` (zero-dep default) and `VLMAttentionDetector`
  (real engagement via a vision LLM). `build_detector(spec)` picks one.
- **Objects / pose** (optional, heavier deps): `ObjectDetector` (YOLO phones),
  `HeadPoseEstimator` (MediaPipe). Import these directly when needed.
"""

from .base import AttentionResult, Detector, BaseDetector
from .motion import MotionPresenceDetector
from .vlm import VLMAttentionDetector
from .factory import build_detector
from . import frames

__all__ = [
    "AttentionResult",
    "Detector",
    "BaseDetector",
    "MotionPresenceDetector",
    "VLMAttentionDetector",
    "build_detector",
    "frames",
]
