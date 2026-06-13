"""Build an attention `Detector` from a plain spec dict.

Apps pass their config; the factory returns a ready detector. If a VLM endpoint
is configured it's used; otherwise it falls back to motion-presence. Unknown
kinds also fall back to motion, so a misconfig degrades instead of crashing.
"""

from __future__ import annotations

import logging
from typing import Any

from .base import Detector
from .motion import MotionPresenceDetector
from .vlm import VLMAttentionDetector

logger = logging.getLogger(__name__)


def build_detector(spec: dict[str, Any]) -> Detector:
    """spec = {"kind": "motion"|"vlm"|"auto", "motion": {...}, "vlm": {...}}."""
    kind = (spec.get("kind") or "auto").lower()
    motion_cfg = spec.get("motion", {}) or {}
    vlm_cfg = spec.get("vlm", {}) or {}

    def _motion() -> Detector:
        return MotionPresenceDetector(**motion_cfg)

    if kind == "motion":
        return _motion()

    if kind in ("vlm", "auto"):
        det = VLMAttentionDetector(**vlm_cfg)
        if det.available:
            logger.info("attention detector: vlm (%s)", vlm_cfg.get("model", "?"))
            return det
        if kind == "vlm":
            logger.warning("vlm detector requested but not configured; using motion")
        return _motion()

    logger.warning("unknown detector kind %r; using motion", kind)
    return _motion()
