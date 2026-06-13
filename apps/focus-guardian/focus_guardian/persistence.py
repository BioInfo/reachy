"""Focus Guardian session history — thin layer over shared.app.SessionStore.

The generic store handles JSONL append + day grouping; this defines the focus
record shape and the daily reducer (sessions, minutes, avg score, nudges). Keeps
the app from re-implementing storage and gives DJ Reactor / Echo the same store
to reuse with their own record shape.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from shared.app.persistence import SessionStore

from .session import SessionStats


class FocusHistory:
    def __init__(self, path: Path):
        self.store = SessionStore(path)

    def record(self, stats: SessionStats, *, duration_minutes: int,
               completed: bool) -> dict[str, Any]:
        return self.store.append({
            "duration_min": duration_minutes,
            "elapsed_s": round(stats.elapsed_s, 1),
            "focused_s": round(stats.focused_s, 1),
            "distracted_s": round(stats.distracted_s, 1),
            "nudges": stats.nudge_count,
            "focus_score": stats.focus_score,
            "completed": completed,
        })

    def totals(self) -> dict[str, Any]:
        recs = self.store.all()
        sessions = len(recs)
        completed = sum(1 for r in recs if r.get("completed"))
        focus_min = round(sum(r.get("focused_s", 0) for r in recs) / 60, 1)
        nudges = sum(r.get("nudges", 0) for r in recs)
        avg = round(sum(r.get("focus_score", 0) for r in recs) / sessions, 1) if sessions else 0.0
        return {"sessions": sessions, "completed": completed,
                "focus_minutes": focus_min, "nudges": nudges, "avg_score": avg}

    def today(self) -> dict[str, Any]:
        return _reduce_day(self.store.today())

    def daily(self) -> dict[str, dict[str, Any]]:
        return self.store.daily_rollup(_reduce_day)


def _reduce_day(recs: list[dict[str, Any]]) -> dict[str, Any]:
    sessions = len(recs)
    return {
        "sessions": sessions,
        "completed": sum(1 for r in recs if r.get("completed")),
        "focus_minutes": round(sum(r.get("focused_s", 0) for r in recs) / 60, 1),
        "nudges": sum(r.get("nudges", 0) for r in recs),
        "avg_score": round(sum(r.get("focus_score", 0) for r in recs) / sessions, 1) if sessions else 0.0,
    }
