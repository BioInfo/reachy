"""
Shared vision utilities for Reachy Mini apps.

Provides common abstractions for:
- Head pose estimation
- Gaze detection
- Object detection (phones, etc.)
- Face detection and tracking
"""

from .head_pose import HeadPoseEstimator, GazeDirection
from .detector import ObjectDetector, DetectionResult

__all__ = [
    "HeadPoseEstimator",
    "GazeDirection",
    "ObjectDetector",
    "DetectionResult",
]
