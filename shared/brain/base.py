"""Pluggable brain layer — shared across robot apps (Echo and friends).

Mirrors `vision/` and `audio/`: a backend turns a turn of conversation into a
normalized `Reply`. A `Brain` takes the user's text plus the running history and
returns what the robot should say (and, optionally, a hint at how it should feel
while saying it). Apps pick a brain by config and never touch the transport.

The whole conversation POC runs on one brain (`LiteLLMBrain`, an OpenAI-compatible
endpoint). `CommandBrain` shells to an external agent and is reserved for the
later assistant-bridge phase. A brain never raises on a bad turn — it returns a
`Reply` with `ok=False` and a message, so the control loop stays alive (same
philosophy as `reachy_utils.safe_motion`).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

# A chat message in OpenAI shape: {"role": "user"|"assistant"|"system", "content": str}.
Message = dict[str, str]


@dataclass
class Reply:
    """One brain response to one turn, normalized across backends."""

    text: str = ""
    emotion: str | None = None   # optional cue for feedback.py (e.g. "happy", "thinking")
    ok: bool = True              # False when the turn failed (loop keeps going)
    error: str = ""              # human-readable reason when ok is False
    model: str = ""              # which model/backend answered, for UI/telemetry
    meta: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "emotion": self.emotion,
            "ok": self.ok,
            "error": self.error,
            "model": self.model,
        }

    @classmethod
    def failed(cls, error: str, model: str = "") -> "Reply":
        """A graceful failure reply — surfaced to the user, never raised."""
        return cls(text="", ok=False, error=error, model=model)


@runtime_checkable
class Brain(Protocol):
    """A conversational backend. Hand it a turn, get a `Reply`."""

    name: str

    @property
    def available(self) -> bool:
        """True if this brain is configured well enough to answer."""

    def respond(self, text: str, history: list[Message]) -> Reply:
        """Answer one user turn.

        `history` is the prior conversation (user/assistant messages, no system
        prompt — the brain owns that). Returns a `Reply`; on any backend error,
        returns `Reply.failed(...)` rather than raising.
        """
