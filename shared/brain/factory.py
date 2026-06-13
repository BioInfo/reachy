"""Build a `Brain` from a plain spec dict.

Mirrors `audio.build_audio_source` / `vision.build_detector`: hand it the app's
config, get a ready brain. Concrete brains are imported lazily so `import
shared.brain` stays light (no openai needed for pure-logic tests).
"""

from __future__ import annotations

import logging
from typing import Any

from .base import Brain

logger = logging.getLogger(__name__)


def build_brain(spec: dict[str, Any]) -> Brain:
    """spec = {"kind": "litellm"|"command", "litellm": {...}, "command": {...}}.

    "litellm" -> LiteLLMBrain(base_url, api_key, model, system_prompt, ...)
    "command" -> CommandBrain(command, timeout)
    """
    kind = (spec.get("kind") or "litellm").lower()

    if kind == "litellm":
        from .litellm import LiteLLMBrain

        cfg = spec.get("litellm", {}) or {}
        return LiteLLMBrain(**cfg)

    if kind == "command":
        from .command import CommandBrain

        cfg = spec.get("command", {}) or {}
        return CommandBrain(**cfg)

    logger.warning("unknown brain kind %r; falling back to litellm", kind)
    from .litellm import LiteLLMBrain

    return LiteLLMBrain(**(spec.get("litellm", {}) or {}))
