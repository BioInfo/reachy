"""Conversation state machine — pure logic, no robot, no brain, no clock.

Mirrors Focus Guardian's `FocusSession` and DJ Reactor's `DJSession`: a
side-effect-free holder of conversation state + message history that the
orchestrator drives and the UI reads. The app translates state into robot
reactions; the session never touches the robot or the model.

The flow for one turn: `begin_turn(text)` records the user message and goes
THINKING (and hands back the prior history for the brain), then `end_turn(reply)`
records the answer and goes SPEAKING, then `to_idle()` settles back. LISTENING is
reserved for the voice phase (a mic turn before THINKING); the text POC goes
IDLE -> THINKING -> SPEAKING -> IDLE.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from shared.brain import Message


class ConversationState(str, Enum):
    IDLE = "idle"            # waiting, gentle idle motion
    LISTENING = "listening"  # taking input (voice phase); reserved
    THINKING = "thinking"    # brain is working
    SPEAKING = "speaking"    # delivering the reply


@dataclass
class ConversationStats:
    turns: int = 0


class ConversationSession:
    """State + message history for one ongoing conversation."""

    def __init__(self, *, max_history: int = 40):
        self.max_history = max_history
        self.reset()

    def reset(self) -> None:
        self.state = ConversationState.IDLE
        self._history: list[Message] = []
        self.turn_count = 0

    # -- queries -----------------------------------------------------------

    @property
    def history(self) -> list[Message]:
        """Copy of the user/assistant message log (no system prompt)."""
        return list(self._history)

    @property
    def active(self) -> bool:
        return self.state != ConversationState.IDLE

    def stats(self) -> ConversationStats:
        return ConversationStats(turns=self.turn_count)

    # -- transitions -------------------------------------------------------

    def set_listening(self) -> None:
        """Voice phase: input is being captured. Reserved; unused in text POC."""
        self.state = ConversationState.LISTENING

    def begin_turn(self, text: str) -> list[Message]:
        """Record the user's turn, go THINKING, and return the PRIOR history.

        The prior history (snapshot taken before this turn is appended) is what
        the brain receives as context — `Brain.respond(text, history)` adds the
        new text itself, so it must not already be in the history.
        """
        prior = self._history[-self.max_history :]
        self._history.append({"role": "user", "content": text})
        self.state = ConversationState.THINKING
        return prior

    def end_turn(self, assistant_text: str) -> None:
        """Record the reply, go SPEAKING, bump the turn count, trim history."""
        self._history.append({"role": "assistant", "content": assistant_text})
        self.turn_count += 1
        self.state = ConversationState.SPEAKING
        self._trim()

    def to_idle(self) -> None:
        self.state = ConversationState.IDLE

    def _trim(self) -> None:
        cap = self.max_history * 2  # user+assistant pairs
        if len(self._history) > cap:
            self._history = self._history[-cap:]
