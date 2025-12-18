"""
Attention monitoring using computer vision.
"""

import logging
import threading
import time
from typing import Optional, Callable
from dataclasses import dataclass
import numpy as np

# Import from shared utilities
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from shared.vision import HeadPoseEstimator, GazeDirection, ObjectDetector

logger = logging.getLogger(__name__)


@dataclass
class AttentionState:
    """Current attention state."""
    is_focused: bool
    gaze_direction: GazeDirection
    confidence: float
    phone_detected: bool
    face_detected: bool


class AttentionMonitor:
    """
    Monitors user attention using Reachy Mini's camera.

    Combines head pose estimation and optional phone detection
    to determine if user is focused on their work.
    """

    def __init__(
        self,
        vision_backend: str = "mediapipe",
        enable_phone_detection: bool = True,
        frame_skip: int = 2,
        on_attention_change: Optional[Callable[[AttentionState], None]] = None,
    ):
        self.vision_backend = vision_backend
        self.enable_phone_detection = enable_phone_detection
        self.frame_skip = frame_skip
        self.on_attention_change = on_attention_change

        # Components
        self._pose_estimator: Optional[HeadPoseEstimator] = None
        self._object_detector: Optional[ObjectDetector] = None

        # State
        self._running = False
        self._frame_count = 0
        self._last_state: Optional[AttentionState] = None
        self._camera = None
        self._thread: Optional[threading.Thread] = None

    def initialize(self):
        """Initialize vision models."""
        logger.info(f"Initializing attention monitor with backend: {self.vision_backend}")

        self._pose_estimator = HeadPoseEstimator(model_name=self.vision_backend)
        self._pose_estimator.load_model()

        if self.enable_phone_detection:
            self._object_detector = ObjectDetector()
            self._object_detector.load_model()

        logger.info("Attention monitor initialized")

    def start(self, camera_index: int = 0):
        """Start monitoring in background thread."""
        if self._running:
            logger.warning("Monitor already running")
            return

        try:
            import cv2
            self._camera = cv2.VideoCapture(camera_index)
            if not self._camera.isOpened():
                raise RuntimeError(f"Could not open camera {camera_index}")

            self._running = True
            self._thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self._thread.start()
            logger.info(f"Started monitoring camera {camera_index}")

        except Exception as e:
            logger.error(f"Failed to start monitoring: {e}")
            raise

    def stop(self):
        """Stop monitoring."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
        if self._camera:
            self._camera.release()
            self._camera = None
        logger.info("Monitoring stopped")

    def _monitor_loop(self):
        """Main monitoring loop."""
        while self._running:
            try:
                ret, frame = self._camera.read()
                if not ret:
                    logger.warning("Failed to read frame")
                    time.sleep(0.1)
                    continue

                self._frame_count += 1

                # Skip frames for performance
                if self._frame_count % self.frame_skip != 0:
                    continue

                state = self._process_frame(frame)

                # Notify on state change
                if self._state_changed(state):
                    self._last_state = state
                    if self.on_attention_change:
                        self.on_attention_change(state)

            except Exception as e:
                logger.error(f"Error in monitor loop: {e}")
                time.sleep(0.1)

    def _process_frame(self, frame: np.ndarray) -> AttentionState:
        """Process a single frame and determine attention state."""
        # Head pose estimation
        pose_result = self._pose_estimator.estimate(frame)

        # Phone detection (optional)
        phone_detected = False
        if self.enable_phone_detection and self._object_detector:
            phone = self._object_detector.detect_phone(frame)
            phone_detected = phone is not None

        # Determine focus state
        is_focused = (
            pose_result.face_detected
            and pose_result.gaze_direction == GazeDirection.MONITOR
            and not phone_detected
        )

        return AttentionState(
            is_focused=is_focused,
            gaze_direction=pose_result.gaze_direction,
            confidence=pose_result.confidence,
            phone_detected=phone_detected,
            face_detected=pose_result.face_detected,
        )

    def _state_changed(self, new_state: AttentionState) -> bool:
        """Check if attention state has meaningfully changed."""
        if self._last_state is None:
            return True
        return (
            new_state.is_focused != self._last_state.is_focused
            or new_state.phone_detected != self._last_state.phone_detected
        )

    def process_single_frame(self, frame: np.ndarray) -> AttentionState:
        """
        Process a single frame (for use with Gradio camera component).

        Args:
            frame: BGR image from camera

        Returns:
            AttentionState with current attention info
        """
        if self._pose_estimator is None:
            self.initialize()

        return self._process_frame(frame)

    def release(self):
        """Release all resources."""
        self.stop()
        if self._pose_estimator:
            self._pose_estimator.release()
        if self._object_detector:
            self._object_detector.release()
        logger.info("Attention monitor released")


class MockAttentionMonitor:
    """Mock monitor for testing without camera."""

    def __init__(self):
        self._is_focused = True
        self._cycle_count = 0

    def initialize(self):
        pass

    def start(self, camera_index: int = 0):
        pass

    def stop(self):
        pass

    def process_single_frame(self, frame: np.ndarray) -> AttentionState:
        """Return mock attention state."""
        # Simulate occasional distraction
        self._cycle_count += 1
        if self._cycle_count % 50 == 0:
            self._is_focused = not self._is_focused

        return AttentionState(
            is_focused=self._is_focused,
            gaze_direction=GazeDirection.MONITOR if self._is_focused else GazeDirection.DOWN,
            confidence=0.95,
            phone_detected=not self._is_focused and self._cycle_count % 100 == 0,
            face_detected=True,
        )

    def release(self):
        pass
