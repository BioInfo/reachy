"""Turn manager — ties the brain to the conversation session.

Thin and pure (the brain is injected): one turn is `begin -> run -> settle`.
The app runs `run()` (the blocking model call) in a worker thread so the control
loop keeps the robot reacting, but begin/settle are instant state updates the
loop applies. Keeping this separate from the threading makes the whole turn
lifecycle unit-testable with a fake brain.

`pick_emotion` is the "emotion-from-reply" hook: for the POC it's just ok ->
speak, failure -> a confused beat. Sentiment-shaped reactions can grow here
without touching the loop.
"""

from __future__ import annotations

from shared.brain import Brain, Message, Reply

from .session import ConversationSession

# Spoken when the model call fails — friendly, never a stack trace.
FALLBACK_LINE = "Sorry, I lost my train of thought for a second. Could you say that again?"


def pick_emotion(reply: Reply) -> str:
    """Map a reply to a feedback event key (see feedback.py)."""
    return "speaking" if reply.ok else "confused"


class ConversationManager:
    """Drives one conversation: history + brain call + emotion, over a session."""

    def __init__(self, brain: Brain, *, max_history: int = 40):
        self.brain = brain
        self.session = ConversationSession(max_history=max_history)

    def begin(self, text: str) -> tuple[str, list[Message]]:
        """Record the user turn (state -> THINKING). Returns (text, prior_history)."""
        prior = self.session.begin_turn(text)
        return text, prior

    def run(self, text: str, prior: list[Message]) -> Reply:
        """The blocking model call. App runs this in a worker thread."""
        return self.brain.respond(text, prior)

    def settle(self, reply: Reply) -> tuple[str, str]:
        """Apply the reply to the session (state -> SPEAKING).

        Returns (spoken_text, emotion_event). On failure the user hears
        FALLBACK_LINE instead of an error string, and the emotion is "confused".
        """
        spoken = reply.text if reply.ok else FALLBACK_LINE
        self.session.end_turn(spoken)
        return spoken, pick_emotion(reply)
