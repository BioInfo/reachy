"""
Object detection utilities for Reachy Mini apps.
"""

import logging
from dataclasses import dataclass
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    """Result from object detection."""
    label: str
    confidence: float
    bbox: tuple[int, int, int, int]  # x, y, width, height


class ObjectDetector:
    """
    Detects objects relevant to productivity tracking.

    Primarily used for phone detection to catch users
    checking their phones during focus sessions.
    """

    PHONE_LABELS = {"cell phone", "mobile phone", "phone", "smartphone"}

    def __init__(self, model_name: str = "yolov8n"):
        """
        Initialize object detector.

        Args:
            model_name: Detection model to use
        """
        self.model_name = model_name
        self._model = None

    def load_model(self):
        """Load the detection model."""
        try:
            from ultralytics import YOLO
            self._model = YOLO(f"{self.model_name}.pt")
            logger.info(f"Loaded {self.model_name} model")
        except ImportError:
            logger.warning("ultralytics not installed, using mock detector")
            self._model = "mock"

    def detect(self, frame: np.ndarray, confidence_threshold: float = 0.5) -> list[DetectionResult]:
        """
        Detect objects in frame.

        Args:
            frame: BGR image from camera
            confidence_threshold: Minimum confidence to include

        Returns:
            List of DetectionResults
        """
        if self._model is None:
            self.load_model()

        if self._model == "mock":
            return []

        results = self._model(frame, verbose=False)[0]
        detections = []

        for box in results.boxes:
            conf = float(box.conf[0])
            if conf < confidence_threshold:
                continue

            cls_id = int(box.cls[0])
            label = self._model.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            detections.append(DetectionResult(
                label=label,
                confidence=conf,
                bbox=(x1, y1, x2 - x1, y2 - y1)
            ))

        return detections

    def detect_phone(self, frame: np.ndarray, confidence_threshold: float = 0.4) -> Optional[DetectionResult]:
        """
        Specifically detect phones in frame.

        Args:
            frame: BGR image from camera
            confidence_threshold: Minimum confidence

        Returns:
            DetectionResult if phone found, None otherwise
        """
        detections = self.detect(frame, confidence_threshold)

        for det in detections:
            if det.label.lower() in self.PHONE_LABELS:
                logger.info(f"Phone detected with confidence {det.confidence:.2f}")
                return det

        return None

    def release(self):
        """Release model resources."""
        self._model = None
