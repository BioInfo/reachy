"""
Head pose estimation for tracking user attention.
"""

import logging
from enum import Enum
from dataclasses import dataclass
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)


class GazeDirection(Enum):
    """Detected gaze direction."""
    MONITOR = "monitor"  # Looking at screen
    AWAY_LEFT = "away_left"
    AWAY_RIGHT = "away_right"
    DOWN = "down"  # Possibly looking at phone
    UP = "up"
    UNKNOWN = "unknown"


@dataclass
class HeadPoseResult:
    """Result from head pose estimation."""
    yaw: float  # Left/right rotation (-90 to 90)
    pitch: float  # Up/down rotation (-90 to 90)
    roll: float  # Tilt (-90 to 90)
    confidence: float
    gaze_direction: GazeDirection
    face_detected: bool


class HeadPoseEstimator:
    """
    Estimates head pose from camera feed to determine user attention.

    Uses lightweight models suitable for real-time processing.
    Can use SmolVLM or MediaPipe for detection.
    """

    def __init__(
        self,
        model_name: str = "mediapipe",
        monitor_yaw_threshold: float = 30.0,
        monitor_pitch_threshold: float = 25.0,
        phone_pitch_threshold: float = 35.0,
    ):
        """
        Initialize head pose estimator.

        Args:
            model_name: Backend to use ('mediapipe', 'smolvlm', 'opencv')
            monitor_yaw_threshold: Max yaw angle to consider "looking at monitor"
            monitor_pitch_threshold: Max pitch angle for monitor
            phone_pitch_threshold: Pitch angle that suggests looking at phone
        """
        self.model_name = model_name
        self.monitor_yaw_threshold = monitor_yaw_threshold
        self.monitor_pitch_threshold = monitor_pitch_threshold
        self.phone_pitch_threshold = phone_pitch_threshold
        self._model = None
        self._face_mesh = None

    def load_model(self):
        """Load the pose estimation model."""
        if self.model_name == "mediapipe":
            self._load_mediapipe()
        elif self.model_name == "smolvlm":
            self._load_smolvlm()
        else:
            logger.warning(f"Unknown model {self.model_name}, using mock")
            self._model = "mock"

    def _load_mediapipe(self):
        """Load MediaPipe face mesh for pose estimation."""
        try:
            import mediapipe as mp
            self._face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self._model = "mediapipe"
            logger.info("MediaPipe face mesh loaded")
        except ImportError:
            logger.warning("MediaPipe not installed, using mock")
            self._model = "mock"

    def _load_smolvlm(self):
        """Load SmolVLM for vision-language pose estimation."""
        try:
            from transformers import AutoProcessor, AutoModelForVision2Seq
            # SmolVLM is lightweight enough for real-time use
            self._processor = AutoProcessor.from_pretrained("HuggingFaceTB/SmolVLM-Instruct")
            self._vlm = AutoModelForVision2Seq.from_pretrained("HuggingFaceTB/SmolVLM-Instruct")
            self._model = "smolvlm"
            logger.info("SmolVLM loaded for pose estimation")
        except ImportError:
            logger.warning("Transformers not installed, using mock")
            self._model = "mock"

    def estimate(self, frame: np.ndarray) -> HeadPoseResult:
        """
        Estimate head pose from a camera frame.

        Args:
            frame: BGR image from camera (numpy array)

        Returns:
            HeadPoseResult with pose angles and gaze direction
        """
        if self._model is None:
            self.load_model()

        if self._model == "mediapipe":
            return self._estimate_mediapipe(frame)
        elif self._model == "smolvlm":
            return self._estimate_smolvlm(frame)
        else:
            return self._estimate_mock(frame)

    def _estimate_mediapipe(self, frame: np.ndarray) -> HeadPoseResult:
        """Estimate pose using MediaPipe."""
        import cv2

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self._face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return HeadPoseResult(
                yaw=0, pitch=0, roll=0,
                confidence=0, gaze_direction=GazeDirection.UNKNOWN,
                face_detected=False
            )

        landmarks = results.multi_face_landmarks[0]

        # Extract key points for pose estimation
        # Nose tip, chin, left eye, right eye, left mouth, right mouth
        h, w = frame.shape[:2]

        nose = landmarks.landmark[1]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]

        # Simple pose estimation from landmark positions
        eye_center_x = (left_eye.x + right_eye.x) / 2
        yaw = (nose.x - eye_center_x) * 180  # Rough approximation

        eye_center_y = (left_eye.y + right_eye.y) / 2
        pitch = (nose.y - eye_center_y) * 180  # Rough approximation

        roll = (right_eye.y - left_eye.y) * 180

        gaze = self._classify_gaze(yaw, pitch)

        return HeadPoseResult(
            yaw=yaw, pitch=pitch, roll=roll,
            confidence=0.8, gaze_direction=gaze,
            face_detected=True
        )

    def _estimate_smolvlm(self, frame: np.ndarray) -> HeadPoseResult:
        """Estimate pose using SmolVLM with a direct question."""
        from PIL import Image

        image = Image.fromarray(frame[:, :, ::-1])  # BGR to RGB

        prompt = "Is the person looking at the camera/screen, looking down at something in their hands, or looking away to the side? Answer with one word: screen, down, or away."

        inputs = self._processor(images=image, text=prompt, return_tensors="pt")
        outputs = self._vlm.generate(**inputs, max_new_tokens=10)
        response = self._processor.decode(outputs[0], skip_special_tokens=True).lower()

        if "screen" in response:
            gaze = GazeDirection.MONITOR
            yaw, pitch = 0, 0
        elif "down" in response:
            gaze = GazeDirection.DOWN
            yaw, pitch = 0, 40
        else:
            gaze = GazeDirection.AWAY_LEFT
            yaw, pitch = 45, 0

        return HeadPoseResult(
            yaw=yaw, pitch=pitch, roll=0,
            confidence=0.7, gaze_direction=gaze,
            face_detected=True
        )

    def _estimate_mock(self, frame: np.ndarray) -> HeadPoseResult:
        """Mock estimation for testing without models."""
        return HeadPoseResult(
            yaw=0, pitch=0, roll=0,
            confidence=1.0, gaze_direction=GazeDirection.MONITOR,
            face_detected=True
        )

    def _classify_gaze(self, yaw: float, pitch: float) -> GazeDirection:
        """Classify gaze direction from pose angles."""
        if abs(yaw) <= self.monitor_yaw_threshold and abs(pitch) <= self.monitor_pitch_threshold:
            return GazeDirection.MONITOR
        elif pitch > self.phone_pitch_threshold:
            return GazeDirection.DOWN
        elif yaw < -self.monitor_yaw_threshold:
            return GazeDirection.AWAY_LEFT
        elif yaw > self.monitor_yaw_threshold:
            return GazeDirection.AWAY_RIGHT
        elif pitch < -self.monitor_pitch_threshold:
            return GazeDirection.UP
        return GazeDirection.UNKNOWN

    def release(self):
        """Release model resources."""
        if self._face_mesh:
            self._face_mesh.close()
            self._face_mesh = None
        self._model = None
