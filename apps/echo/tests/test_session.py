"""Pure-logic tests for ConversationSession (no robot, no brain, no clock).

Run from the repo root:  ./venv/bin/python -m pytest apps/echo/tests/test_session.py
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "apps" / "echo"))

from echo.session import ConversationSession, ConversationState  # noqa: E402


def test_starts_idle_and_empty():
    s = ConversationSession()
    assert s.state is ConversationState.IDLE
    assert s.history == []
    assert s.active is False
    assert s.stats().turns == 0


def test_begin_turn_records_user_and_goes_thinking():
    s = ConversationSession()
    prior = s.begin_turn("hello")
    assert prior == []  # nothing before the first turn
    assert s.state is ConversationState.THINKING
    assert s.active is True
    assert s.history == [{"role": "user", "content": "hello"}]


def test_begin_turn_returns_prior_without_the_new_message():
    """The brain adds the new text itself, so prior must exclude it."""
    s = ConversationSession()
    s.begin_turn("first")
    s.end_turn("answer one")
    prior = s.begin_turn("second")
    assert {"role": "user", "content": "second"} not in prior
    assert prior[-1] == {"role": "assistant", "content": "answer one"}


def test_end_turn_records_reply_bumps_count_and_speaks():
    s = ConversationSession()
    s.begin_turn("hi")
    s.end_turn("hey there")
    assert s.state is ConversationState.SPEAKING
    assert s.stats().turns == 1
    assert s.history[-1] == {"role": "assistant", "content": "hey there"}


def test_full_turn_cycle_text_poc():
    s = ConversationSession()
    s.begin_turn("q")
    s.end_turn("a")
    s.to_idle()
    assert s.state is ConversationState.IDLE
    assert s.active is False
    assert s.stats().turns == 1


def test_set_listening_is_reserved_voice_state():
    s = ConversationSession()
    s.set_listening()
    assert s.state is ConversationState.LISTENING
    assert s.active is True


def test_history_is_a_copy_not_a_handle():
    s = ConversationSession()
    s.begin_turn("hi")
    h = s.history
    h.append({"role": "user", "content": "injected"})
    assert len(s.history) == 1  # internal log untouched


def test_history_trims_to_cap():
    s = ConversationSession(max_history=2)
    for i in range(10):
        s.begin_turn(f"u{i}")
        s.end_turn(f"a{i}")
    # cap = max_history * 2 message-pairs = 4 messages retained
    assert len(s.history) == 4
    assert s.history[0] == {"role": "user", "content": "u8"}
    assert s.history[-1] == {"role": "assistant", "content": "a9"}
    assert s.stats().turns == 10  # count is not trimmed


def test_reset_clears_everything():
    s = ConversationSession()
    s.begin_turn("hi")
    s.end_turn("yo")
    s.reset()
    assert s.state is ConversationState.IDLE
    assert s.history == []
    assert s.stats().turns == 0
