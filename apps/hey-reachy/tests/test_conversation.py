"""Pure-logic tests for ConversationManager (fake brain, no network/robot).

Run from the repo root:  ./venv/bin/python -m pytest apps/hey-reachy/tests/test_conversation.py
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "apps" / "hey-reachy"))

from shared.brain import Reply                                   # noqa: E402
from hey_reachy.conversation import (                                  # noqa: E402
    ConversationManager,
    FALLBACK_LINE,
    pick_emotion,
)
from hey_reachy.session import ConversationState                       # noqa: E402


class FakeBrain:
    """Echoes back, or fails on demand — records what history it received."""

    name = "fake"
    available = True

    def __init__(self, reply: Reply | None = None):
        self._reply = reply
        self.seen_history: list[list] = []
        self.seen_text: list[str] = []

    def respond(self, text, history):
        self.seen_text.append(text)
        self.seen_history.append(list(history))
        return self._reply or Reply(text=f"echo: {text}")


# --- pick_emotion ----------------------------------------------------------

def test_pick_emotion_ok_speaks():
    assert pick_emotion(Reply(text="hi")) == "speaking"


def test_pick_emotion_failure_is_confused():
    assert pick_emotion(Reply.failed("boom")) == "confused"


# --- happy turn ------------------------------------------------------------

def test_begin_sets_thinking_and_returns_text_and_prior():
    m = ConversationManager(FakeBrain())
    text, prior = m.begin("hello")
    assert text == "hello"
    assert prior == []
    assert m.session.state is ConversationState.THINKING


def test_run_calls_brain_with_prior_only():
    brain = FakeBrain()
    m = ConversationManager(brain)
    # turn 1
    _, p1 = m.begin("one")
    m.settle(m.run("one", p1))
    # turn 2 — brain should see turn-1 in history but NOT "two"
    _, p2 = m.begin("two")
    m.run("two", p2)
    assert brain.seen_text == ["one", "two"]
    assert {"role": "user", "content": "two"} not in brain.seen_history[-1]
    assert {"role": "assistant", "content": "echo: one"} in brain.seen_history[-1]


def test_settle_speaks_and_records_reply():
    m = ConversationManager(FakeBrain(Reply(text="sure thing")))
    _, prior = m.begin("hi")
    spoken, emotion = m.settle(m.run("hi", prior))
    assert spoken == "sure thing"
    assert emotion == "speaking"
    assert m.session.state is ConversationState.SPEAKING
    assert m.session.history[-1] == {"role": "assistant", "content": "sure thing"}
    assert m.session.stats().turns == 1


# --- graceful failure ------------------------------------------------------

def test_failed_reply_speaks_fallback_line_not_an_error():
    m = ConversationManager(FakeBrain(Reply.failed("model down")))
    _, prior = m.begin("hi")
    spoken, emotion = m.settle(m.run("hi", prior))
    assert spoken == FALLBACK_LINE
    assert emotion == "confused"
    # the fallback is what gets remembered (so history stays coherent)
    assert m.session.history[-1]["content"] == FALLBACK_LINE


def test_multi_turn_history_accumulates():
    m = ConversationManager(FakeBrain())
    for t in ("a", "b", "c"):
        _, prior = m.begin(t)
        m.settle(m.run(t, prior))
    assert m.session.stats().turns == 3
    assert len(m.session.history) == 6  # 3 user + 3 assistant
