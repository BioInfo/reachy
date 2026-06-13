"""Build an `AudioSource` from a plain spec dict.

Mirrors `vision.build_detector`: hand it the app's config, get a ready source.
If a capture backend exists, returns a live mic/loopback source; otherwise (no
sounddevice, headless box, requested "silent") returns `SilentAudioSource` so the
app runs without audio instead of crashing.
"""

from __future__ import annotations

import logging
from typing import Any

from .base import AudioSource, SilentAudioSource
from .capture import MicAudioSource, sounddevice_available

logger = logging.getLogger(__name__)


def build_audio_source(spec: dict[str, Any]) -> AudioSource:
    """spec = {"kind": "mic"|"silent"|"auto", "mic": {device_index, sample_rate, chunk_size, sensitivity}}."""
    kind = (spec.get("kind") or "auto").lower()
    mic_cfg = spec.get("mic", {}) or {}

    if kind == "silent":
        return SilentAudioSource()

    if kind in ("mic", "auto"):
        if sounddevice_available():
            logger.info("audio source: mic (device=%s)", mic_cfg.get("device_index"))
            return MicAudioSource(**mic_cfg)
        if kind == "mic":
            logger.warning("mic source requested but sounddevice missing; using silent")
        return SilentAudioSource()

    logger.warning("unknown audio source kind %r; using silent", kind)
    return SilentAudioSource()
