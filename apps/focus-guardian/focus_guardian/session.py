"""Focus session state machine — pure logic, no robot, no wall clock.

`tick(delta, focused)` advances the session and returns the events that fired
this tick (nudge, escalate, completed, break start/end). Being delta-driven and
side-effect-free makes it fully unit-testable: feed it a sequence of ticks and
assert on the events, no monkeypatching time. The app translates events into
robot reactions; the session never touches the robot.

v1 mixed `time.time()` into the session, returned a bare bool, and had no break
phase. This separates concerns and adds the break timer.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class SessionState(str, Enum):
    IDLE = "idle"
    FOCUSING = "focusing"
    DISTRACTED = "distracted"   # focusing, but currently away
    BREAK = "break"
    COMPLETED = "completed"     # focus block done (and break, if any, done)


class SessionEvent(str, Enum):
    NUDGE = "nudge"             # first/gentle attention grab
    ESCALATE = "escalate"      # repeated distraction, firmer reaction
    COMPLETED = "completed"     # focus block finished
    BREAK_STARTED = "break_started"
    BREAK_ENDED = "break_ended"


@dataclass
class SessionStats:
    elapsed_s: float = 0.0
    focused_s: float = 0.0
    distracted_s: float = 0.0
    nudge_count: int = 0
    completed: bool = False

    @property
    def focus_score(self) -> float:
        """0..100. Share of time focused, with small completion/no-nudge bonuses."""
        if self.elapsed_s <= 0:
            return 0.0
        score = (self.focused_s / self.elapsed_s) * 100
        if self.nudge_count == 0:
            score += 5
        if self.completed:
            score += 10
        return round(min(100.0, max(0.0, score)), 1)


class FocusSession:
    def __init__(self, *, duration_minutes: int, break_minutes: int = 0,
                 distraction_grace_s: float = 5.0, nudge_cooldown_s: float = 20.0):
        self.duration_s = duration_minutes * 60
        self.break_s = break_minutes * 60
        self.distraction_grace_s = distraction_grace_s
        self.nudge_cooldown_s = nudge_cooldown_s
        self.reset()

    def reset(self) -> None:
        self.state = SessionState.IDLE
        self.elapsed_s = 0.0
        self.focused_s = 0.0
        self.distracted_s = 0.0
        self.nudge_count = 0
        self.break_elapsed_s = 0.0
        self._distraction_run_s = 0.0
        self._since_last_nudge_s = self.nudge_cooldown_s  # allow an immediate first nudge

    def start(self) -> None:
        self.reset()
        self.state = SessionState.FOCUSING

    # -- queries -----------------------------------------------------------

    @property
    def active(self) -> bool:
        return self.state in (SessionState.FOCUSING, SessionState.DISTRACTED, SessionState.BREAK)

    @property
    def remaining_s(self) -> float:
        if self.state == SessionState.BREAK:
            return max(0.0, self.break_s - self.break_elapsed_s)
        return max(0.0, self.duration_s - self.elapsed_s)

    @property
    def remaining_formatted(self) -> str:
        m, s = divmod(int(self.remaining_s), 60)
        return f"{m:02d}:{s:02d}"

    @property
    def progress(self) -> float:
        total = self.break_s if self.state == SessionState.BREAK else self.duration_s
        if total <= 0:
            return 0.0
        done = self.break_elapsed_s if self.state == SessionState.BREAK else self.elapsed_s
        return min(1.0, done / total)

    def stats(self) -> SessionStats:
        return SessionStats(
            elapsed_s=self.elapsed_s,
            focused_s=self.focused_s,
            distracted_s=self.distracted_s,
            nudge_count=self.nudge_count,
            completed=self.state == SessionState.COMPLETED,
        )

    # -- advance -----------------------------------------------------------

    def tick(self, delta: float, focused: bool) -> list[SessionEvent]:
        if delta <= 0 or not self.active:
            return []

        if self.state == SessionState.BREAK:
            return self._tick_break(delta)

        events: list[SessionEvent] = []
        self.elapsed_s += delta
        self._since_last_nudge_s += delta

        if focused:
            self.focused_s += delta
            self._distraction_run_s = 0.0
            self.state = SessionState.FOCUSING
        else:
            self.distracted_s += delta
            self._distraction_run_s += delta
            self.state = SessionState.DISTRACTED
            if (self._distraction_run_s >= self.distraction_grace_s
                    and self._since_last_nudge_s >= self.nudge_cooldown_s):
                self.nudge_count += 1
                self._since_last_nudge_s = 0.0
                self._distraction_run_s = 0.0
                events.append(SessionEvent.ESCALATE if self.nudge_count > 1
                              else SessionEvent.NUDGE)

        if self.elapsed_s >= self.duration_s:
            events.append(SessionEvent.COMPLETED)
            if self.break_s > 0:
                self.state = SessionState.BREAK
                self.break_elapsed_s = 0.0
                events.append(SessionEvent.BREAK_STARTED)
            else:
                self.state = SessionState.COMPLETED

        return events

    def _tick_break(self, delta: float) -> list[SessionEvent]:
        self.break_elapsed_s += delta
        if self.break_elapsed_s >= self.break_s:
            self.state = SessionState.COMPLETED
            return [SessionEvent.BREAK_ENDED]
        return []

    def stop(self) -> None:
        """End the session early (no completion bonus)."""
        self.state = SessionState.IDLE
