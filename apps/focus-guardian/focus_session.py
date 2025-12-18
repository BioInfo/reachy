"""
Focus session state management.
"""

import time
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Callable
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class SessionState(Enum):
    """Possible states of a focus session."""
    IDLE = "idle"
    FOCUSING = "focusing"
    DISTRACTED = "distracted"
    BREAK = "break"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class SessionStats:
    """Statistics for a completed session."""
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int = 0
    time_focused_seconds: int = 0
    time_distracted_seconds: int = 0
    nudge_count: int = 0
    completed: bool = False

    @property
    def focus_score(self) -> float:
        """Calculate focus score as percentage."""
        if self.duration_seconds == 0:
            return 0.0

        base_score = (self.time_focused_seconds / self.duration_seconds) * 100

        # Bonuses
        if self.nudge_count == 0:
            base_score += 5
        if self.completed:
            base_score += 10

        # Penalties
        if self.nudge_count > 5:
            base_score -= 10

        return min(100.0, max(0.0, base_score))


class FocusSession:
    """
    Manages a single focus session.

    Tracks time, focus state, and triggers callbacks for robot actions.
    """

    def __init__(
        self,
        duration_minutes: int = 25,
        distraction_threshold_seconds: float = 10.0,
        nudge_cooldown_seconds: float = 30.0,
        on_nudge: Optional[Callable[[int], None]] = None,
        on_state_change: Optional[Callable[[SessionState], None]] = None,
        on_complete: Optional[Callable[[SessionStats], None]] = None,
    ):
        self.duration_seconds = duration_minutes * 60
        self.distraction_threshold = distraction_threshold_seconds
        self.nudge_cooldown = nudge_cooldown_seconds

        # Callbacks
        self.on_nudge = on_nudge
        self.on_state_change = on_state_change
        self.on_complete = on_complete

        # State
        self._state = SessionState.IDLE
        self._start_time: Optional[datetime] = None
        self._elapsed_seconds = 0
        self._time_focused = 0
        self._time_distracted = 0
        self._nudge_count = 0

        # Distraction tracking
        self._distraction_start: Optional[float] = None
        self._last_nudge_time: Optional[float] = None
        self._is_focused = True

    @property
    def state(self) -> SessionState:
        return self._state

    @state.setter
    def state(self, new_state: SessionState):
        if new_state != self._state:
            old_state = self._state
            self._state = new_state
            logger.info(f"Session state: {old_state.value} -> {new_state.value}")
            if self.on_state_change:
                self.on_state_change(new_state)

    @property
    def remaining_seconds(self) -> int:
        """Seconds remaining in session."""
        return max(0, self.duration_seconds - self._elapsed_seconds)

    @property
    def remaining_formatted(self) -> str:
        """Remaining time as MM:SS string."""
        mins, secs = divmod(int(self.remaining_seconds), 60)
        return f"{mins:02d}:{secs:02d}"

    @property
    def progress(self) -> float:
        """Session progress as 0-1 float."""
        if self.duration_seconds == 0:
            return 0.0
        return min(1.0, self._elapsed_seconds / self.duration_seconds)

    def start(self):
        """Start the focus session."""
        if self._state != SessionState.IDLE:
            logger.warning(f"Cannot start session in state {self._state}")
            return

        self._start_time = datetime.now()
        self._elapsed_seconds = 0
        self._time_focused = 0
        self._time_distracted = 0
        self._nudge_count = 0
        self._distraction_start = None
        self._last_nudge_time = None
        self._is_focused = True

        self.state = SessionState.FOCUSING
        logger.info(f"Session started: {self.duration_seconds}s")

    def stop(self, cancelled: bool = False):
        """Stop the session."""
        if self._state not in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return

        end_time = datetime.now()
        completed = not cancelled and self._elapsed_seconds >= self.duration_seconds

        stats = SessionStats(
            start_time=self._start_time,
            end_time=end_time,
            duration_seconds=self._elapsed_seconds,
            time_focused_seconds=self._time_focused,
            time_distracted_seconds=self._time_distracted,
            nudge_count=self._nudge_count,
            completed=completed,
        )

        self.state = SessionState.COMPLETED if completed else SessionState.CANCELLED

        if self.on_complete:
            self.on_complete(stats)

        logger.info(f"Session ended: completed={completed}, focus_score={stats.focus_score:.1f}%")
        return stats

    def tick(self, delta_seconds: float = 1.0):
        """
        Update session timer.

        Call this regularly (e.g., every second) to advance the session.
        """
        if self._state not in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return

        self._elapsed_seconds += delta_seconds

        # Track focus/distraction time
        if self._is_focused:
            self._time_focused += delta_seconds
        else:
            self._time_distracted += delta_seconds

        # Check if session complete
        if self._elapsed_seconds >= self.duration_seconds:
            self.stop(cancelled=False)

    def update_attention(self, is_focused: bool):
        """
        Update attention state from vision system.

        Args:
            is_focused: True if user appears focused on monitor
        """
        if self._state not in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return

        current_time = time.time()

        if is_focused:
            # User is focused
            if not self._is_focused:
                # Was distracted, now refocused
                self._distraction_start = None
                self._is_focused = True
                self.state = SessionState.FOCUSING
                logger.debug("User refocused")

        else:
            # User appears distracted
            if self._is_focused:
                # Just started being distracted
                self._distraction_start = current_time
                self._is_focused = False
                logger.debug("Distraction started")

            elif self._distraction_start is not None:
                # Continuing distraction
                distraction_duration = current_time - self._distraction_start

                if distraction_duration >= self.distraction_threshold:
                    self.state = SessionState.DISTRACTED
                    self._try_nudge(current_time)

    def _try_nudge(self, current_time: float):
        """Attempt to nudge user if cooldown has passed."""
        if self._last_nudge_time is not None:
            time_since_nudge = current_time - self._last_nudge_time
            if time_since_nudge < self.nudge_cooldown:
                return  # Still in cooldown

        # Perform nudge
        self._last_nudge_time = current_time
        self._nudge_count += 1

        logger.info(f"Nudging user (count: {self._nudge_count})")

        if self.on_nudge:
            self.on_nudge(self._nudge_count)

    def get_stats(self) -> dict:
        """Get current session statistics."""
        return {
            "state": self._state.value,
            "elapsed_seconds": self._elapsed_seconds,
            "remaining_seconds": self.remaining_seconds,
            "remaining_formatted": self.remaining_formatted,
            "progress": self.progress,
            "time_focused": self._time_focused,
            "time_distracted": self._time_distracted,
            "nudge_count": self._nudge_count,
            "focus_score": (self._time_focused / max(1, self._elapsed_seconds)) * 100,
        }


class DailyTracker:
    """Tracks focus sessions across a day."""

    def __init__(self):
        self.sessions: list[SessionStats] = []
        self._date = datetime.now().date()

    def add_session(self, stats: SessionStats):
        """Add a completed session."""
        # Reset if new day
        if datetime.now().date() != self._date:
            self.sessions = []
            self._date = datetime.now().date()

        self.sessions.append(stats)

    @property
    def sessions_completed(self) -> int:
        """Number of completed sessions today."""
        return sum(1 for s in self.sessions if s.completed)

    @property
    def total_focus_time(self) -> int:
        """Total focused time in seconds."""
        return sum(s.time_focused_seconds for s in self.sessions)

    @property
    def total_nudges(self) -> int:
        """Total nudges today."""
        return sum(s.nudge_count for s in self.sessions)

    @property
    def average_focus_score(self) -> float:
        """Average focus score across sessions."""
        if not self.sessions:
            return 0.0
        return sum(s.focus_score for s in self.sessions) / len(self.sessions)

    def get_daily_stats(self) -> dict:
        """Get daily statistics."""
        return {
            "sessions_completed": self.sessions_completed,
            "total_focus_minutes": self.total_focus_time // 60,
            "total_nudges": self.total_nudges,
            "average_focus_score": self.average_focus_score,
        }
