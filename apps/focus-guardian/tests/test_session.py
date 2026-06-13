"""Pure-logic tests for FocusSession + FocusConfig + FocusHistory (no robot)."""

import sys
from pathlib import Path

# make repo `shared` and the app package importable when run directly
_here = Path(__file__).resolve()
for p in _here.parents:
    if (p / "shared" / "__init__.py").exists():
        sys.path.insert(0, str(p))
        break
sys.path.insert(0, str(_here.parents[1]))  # apps/focus-guardian

from focus_guardian.session import FocusSession, SessionState, SessionEvent  # noqa: E402
from focus_guardian.config import FocusConfig  # noqa: E402
from focus_guardian.persistence import FocusHistory  # noqa: E402


def _run(session, *, focused, ticks, delta=1.0):
    evs = []
    for _ in range(ticks):
        evs.extend(session.tick(delta, focused))
    return evs


def test_idle_until_started():
    s = FocusSession(duration_minutes=1)
    assert s.state == SessionState.IDLE
    assert s.tick(1.0, True) == []  # ticking before start does nothing


def test_focus_accumulates_no_nudge():
    s = FocusSession(duration_minutes=1, distraction_grace_s=5, nudge_cooldown_s=20)
    s.start()
    evs = _run(s, focused=True, ticks=30)
    assert evs == []
    assert s.focused_s == 30
    assert s.distracted_s == 0
    assert s.state == SessionState.FOCUSING


def test_nudge_after_grace():
    s = FocusSession(duration_minutes=5, distraction_grace_s=5, nudge_cooldown_s=20)
    s.start()
    # 4s distracted -> no nudge yet (grace=5)
    assert _run(s, focused=False, ticks=4) == []
    # 5th distracted second crosses grace -> NUDGE
    evs = s.tick(1.0, False)
    assert SessionEvent.NUDGE in evs
    assert s.nudge_count == 1
    assert s.state == SessionState.DISTRACTED


def test_escalate_on_second_nudge_respects_cooldown():
    s = FocusSession(duration_minutes=10, distraction_grace_s=3, nudge_cooldown_s=10)
    s.start()
    e1 = _run(s, focused=False, ticks=3)
    assert SessionEvent.NUDGE in e1
    # immediately distracted again: grace would pass but cooldown (10s) blocks
    e2 = _run(s, focused=False, ticks=3)
    assert e2 == []
    # wait out the cooldown while still distracted -> ESCALATE (2nd nudge)
    e3 = _run(s, focused=False, ticks=7)
    assert SessionEvent.ESCALATE in e3
    assert s.nudge_count == 2


def test_completion_and_break():
    s = FocusSession(duration_minutes=1, break_minutes=1)  # 60s focus, 60s break
    s.start()
    evs = _run(s, focused=True, ticks=60)
    assert SessionEvent.COMPLETED in evs
    assert SessionEvent.BREAK_STARTED in evs
    assert s.state == SessionState.BREAK
    # run the break to its end
    bevs = _run(s, focused=True, ticks=60)
    assert SessionEvent.BREAK_ENDED in bevs
    assert s.state == SessionState.COMPLETED


def test_completion_without_break_is_terminal():
    s = FocusSession(duration_minutes=1, break_minutes=0)
    s.start()
    evs = _run(s, focused=True, ticks=60)
    assert SessionEvent.COMPLETED in evs
    assert SessionEvent.BREAK_STARTED not in evs
    assert s.state == SessionState.COMPLETED


def test_focus_score_bonuses():
    s = FocusSession(duration_minutes=1, break_minutes=0)
    s.start()
    _run(s, focused=True, ticks=60)  # 100% focused, 0 nudges, completed
    st = s.stats()
    assert st.completed
    assert st.focus_score == 100.0  # capped (100 + 5 + 10 clamped)


def test_config_env_and_overrides(monkeypatch=None):
    import os
    os.environ["FG_DURATION_MIN"] = "45"
    os.environ["FG_MOTION_ROI_RIGHT"] = "0.5"
    cfg = FocusConfig.from_env()
    assert cfg.duration_minutes == 45
    assert cfg.detector_spec()["motion"]["roi_right"] == 0.5
    # public dict never leaks the api key field
    cfg.vlm_api_key = "secret"
    assert "vlm_api_key" not in cfg.public_dict()
    # overrides only touch allowed fields
    cfg.apply_overrides(duration_minutes=10, ui_port=9999)
    assert cfg.duration_minutes == 10
    assert cfg.ui_port == 7862  # unchanged (not in allowed set)
    del os.environ["FG_DURATION_MIN"]
    del os.environ["FG_MOTION_ROI_RIGHT"]


def test_history_roundtrip(tmp_path):
    h = FocusHistory(tmp_path / "history.jsonl")
    s = FocusSession(duration_minutes=1, break_minutes=0)
    s.start()
    for _ in range(40):
        s.tick(1.0, True)
    for _ in range(20):
        s.tick(1.0, False)
    st = s.stats()
    h.record(st, duration_minutes=1, completed=False)
    h.record(st, duration_minutes=1, completed=True)
    totals = h.totals()
    assert totals["sessions"] == 2
    assert totals["completed"] == 1
    daily = h.daily()
    assert len(daily) == 1
    (day_stats,) = daily.values()
    assert day_stats["sessions"] == 2
