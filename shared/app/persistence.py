"""Generic append-only session history with daily rollups.

Every app that runs "sessions" (a focus block, a DJ set, a chat) wants the same
thing: append a record when one finishes, read history back, and roll it up by
day. The record shape is the app's business — this store is dict-in, dict-out.
It stamps `ts` (epoch) and `day` (YYYY-MM-DD) on append if absent so rollups
work without the app thinking about it.

Storage is JSON Lines (one record per line) under the app's data dir — append
is atomic-enough for a single-writer desktop app and trivially inspectable.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Iterable, Optional

logger = logging.getLogger(__name__)


class SessionStore:
    def __init__(self, path: Path, *, clock: Callable[[], float] = time.time):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._clock = clock

    # -- write -------------------------------------------------------------

    def append(self, record: dict[str, Any]) -> dict[str, Any]:
        """Append a record, stamping ts/day if missing. Returns the stored record."""
        rec = dict(record)
        if "ts" not in rec:
            rec["ts"] = self._clock()
        if "day" not in rec:
            rec["day"] = datetime.fromtimestamp(rec["ts"]).strftime("%Y-%m-%d")
        try:
            with self.path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(rec) + "\n")
        except Exception as e:  # noqa: BLE001
            logger.warning("session append failed: %s", e)
        return rec

    # -- read --------------------------------------------------------------

    def all(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        out: list[dict[str, Any]] = []
        with self.path.open(encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    continue  # skip a corrupt line rather than fail the read
        return out

    def recent(self, n: int = 10) -> list[dict[str, Any]]:
        return self.all()[-n:]

    def for_day(self, day: str) -> list[dict[str, Any]]:
        return [r for r in self.all() if r.get("day") == day]

    def today(self, *, clock: Optional[Callable[[], float]] = None) -> list[dict[str, Any]]:
        now = (clock or self._clock)()
        day = datetime.fromtimestamp(now).strftime("%Y-%m-%d")
        return self.for_day(day)

    def daily_rollup(
        self,
        reduce: Callable[[list[dict[str, Any]]], dict[str, Any]],
        records: Optional[Iterable[dict[str, Any]]] = None,
    ) -> dict[str, dict[str, Any]]:
        """Group records by day and apply `reduce` to each day's list.

        `reduce` is app-supplied (it knows the record shape): given a day's
        records, return that day's aggregate dict. Returns {day: aggregate}.
        """
        recs = list(records) if records is not None else self.all()
        by_day: dict[str, list[dict[str, Any]]] = {}
        for r in recs:
            by_day.setdefault(r.get("day", "unknown"), []).append(r)
        return {day: reduce(rs) for day, rs in sorted(by_day.items())}
