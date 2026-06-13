"""DJ set history — thin layer over shared.app.SessionStore.

The generic store handles JSONL append + day grouping; this defines the set
record shape (vibing minutes, beats, peak BPM, drops, genre) and the daily
reducer. Same pattern as Focus Guardian's `FocusHistory`, reusing the shared
store so every app persists the same way.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from shared.app.persistence import SessionStore

from .session import DJStats


class DJHistory:
    def __init__(self, path: Path):
        self.store = SessionStore(path)

    def record(self, stats: DJStats, *, genre: str) -> dict[str, Any]:
        return self.store.append({
            "genre": genre,
            "elapsed_s": round(stats.elapsed_s, 1),
            "vibing_s": round(stats.vibing_s, 1),
            "beats": stats.beats,
            "drops": stats.drops,
            "peak_bpm": round(stats.peak_bpm, 1),
        })

    def totals(self) -> dict[str, Any]:
        recs = self.store.all()
        sets = len(recs)
        vibing_min = round(sum(r.get("vibing_s", 0) for r in recs) / 60, 1)
        beats = sum(r.get("beats", 0) for r in recs)
        drops = sum(r.get("drops", 0) for r in recs)
        peak = round(max((r.get("peak_bpm", 0) for r in recs), default=0.0), 1)
        return {"sets": sets, "vibing_minutes": vibing_min,
                "beats": beats, "drops": drops, "peak_bpm": peak}

    def today(self) -> dict[str, Any]:
        return _reduce_day(self.store.today())

    def daily(self) -> dict[str, dict[str, Any]]:
        return self.store.daily_rollup(_reduce_day)


def _reduce_day(recs: list[dict[str, Any]]) -> dict[str, Any]:
    sets = len(recs)
    return {
        "sets": sets,
        "vibing_minutes": round(sum(r.get("vibing_s", 0) for r in recs) / 60, 1),
        "beats": sum(r.get("beats", 0) for r in recs),
        "drops": sum(r.get("drops", 0) for r in recs),
        "peak_bpm": round(max((r.get("peak_bpm", 0) for r in recs), default=0.0), 1),
    }
