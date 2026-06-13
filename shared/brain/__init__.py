"""Pluggable conversational brain for Reachy apps.

Light on import: only the base types and the factory are re-exported here. The
concrete brains (and their deps, e.g. openai) load lazily inside `build_brain`,
so pure-logic code and tests can `import shared.brain` without the transport deps.
"""

from __future__ import annotations

from .base import Brain, Message, Reply
from .factory import build_brain

__all__ = ["Brain", "Message", "Reply", "build_brain"]
