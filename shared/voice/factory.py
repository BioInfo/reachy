"""Build the voice backends from a plain spec dict.

Mirrors `brain.build_brain` / `vision.build_detector`: hand it the app's config,
get ready TTS / STT / wake backends (and the VAD). Each builder degrades to its
safe fallback when its backend is unavailable, so an app always gets *something*
usable. Concrete backends import lazily, keeping `import shared.voice` light.
"""

from __future__ import annotations

import logging
from typing import Any

from .base import STTEngine, TTSEngine, WakeWord
from .vad import VADSegmenter

logger = logging.getLogger(__name__)


def build_tts(spec: dict[str, Any]) -> TTSEngine:
    """spec = {"kind": "gateway"|"silent", "gateway": {base_url, api_key, model, voice, ...}}."""
    kind = (spec.get("kind") or "gateway").lower()
    if kind in ("gateway", "openai", "kokoro"):
        from .tts import GatewayTTS, SilentTTS

        tts = GatewayTTS(**(spec.get("gateway", {}) or {}))
        return tts if tts.available else SilentTTS()
    from .tts import SilentTTS

    return SilentTTS()


def build_stt(spec: dict[str, Any]) -> STTEngine:
    """spec = {"kind": "gateway"|"null", "gateway": {base_url, api_key, model, language, ...}}."""
    kind = (spec.get("kind") or "gateway").lower()
    if kind in ("gateway", "openai", "whisper"):
        from .stt import GatewaySTT, NullSTT

        stt = GatewaySTT(**(spec.get("gateway", {}) or {}))
        return stt if stt.available else NullSTT()
    from .stt import NullSTT

    return NullSTT()


def build_wake(spec: dict[str, Any]) -> WakeWord:
    """spec = {"kind": "porcupine"|"openwakeword"|"always", <kind>: {...}}.

    Tries the requested backend; if it can't initialize (missing key/dep), falls
    back to openWakeWord, then to AlwaysWake — so the loop always has a trigger.
    """
    kind = (spec.get("kind") or "always").lower()

    if kind == "porcupine":
        from .wake import OpenWakeWord, PorcupineWake

        w = PorcupineWake(**(spec.get("porcupine", {}) or {}))
        if w.available:
            return w
        logger.info("Porcupine unavailable — trying openWakeWord")
        oww = OpenWakeWord(**(spec.get("openwakeword", {}) or {}))
        if oww.available:
            return oww

    if kind == "openwakeword":
        from .wake import OpenWakeWord

        oww = OpenWakeWord(**(spec.get("openwakeword", {}) or {}))
        if oww.available:
            return oww

    from .wake import AlwaysWake

    return AlwaysWake()


def build_vad(spec: dict[str, Any]) -> VADSegmenter:
    return VADSegmenter(**(spec.get("vad", {}) or {}))
