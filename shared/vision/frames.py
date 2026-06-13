"""Frame helpers shared by detectors and any app that touches the camera."""

from __future__ import annotations

import base64
from typing import Optional

import cv2
import numpy as np


def region_of_interest(frame: np.ndarray, left: float = 0.0, right: float = 1.0,
                       top: float = 0.0, bottom: float = 1.0) -> np.ndarray:
    """Crop a fractional ROI (0..1 of width/height). Defaults to the whole frame."""
    h, w = frame.shape[:2]
    x0, x1 = int(w * left), int(w * right)
    y0, y1 = int(h * top), int(h * bottom)
    return frame[y0:y1, x0:x1]


def to_blurred_gray(frame: np.ndarray, blur: int = 21) -> np.ndarray:
    """Grayscale + Gaussian blur — the standard prep for frame-diff motion."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    if blur and blur > 1:
        k = blur if blur % 2 == 1 else blur + 1  # kernel must be odd
        gray = cv2.GaussianBlur(gray, (k, k), 0)
    return gray


def motion_fraction(prev_gray: np.ndarray, gray: np.ndarray, threshold: int = 30) -> float:
    """Fraction of pixels that changed between two prepped gray frames (0..1)."""
    diff = cv2.absdiff(prev_gray, gray)
    thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)[1]
    return float(np.count_nonzero(thresh)) / float(thresh.size)


def encode_jpeg_b64(frame: np.ndarray, max_width: int = 640, quality: int = 70) -> Optional[str]:
    """Downscale + JPEG-encode a frame to a base64 string (for VLM payloads)."""
    h, w = frame.shape[:2]
    if w > max_width:
        scale = max_width / w
        frame = cv2.resize(frame, (max_width, int(h * scale)))
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        return None
    return base64.b64encode(buf.tobytes()).decode("ascii")
