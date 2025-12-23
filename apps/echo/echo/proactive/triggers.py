"""
Proactive Behavior Triggers

Define conditions that trigger proactive behaviors.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Callable, Optional, Any

logger = logging.getLogger(__name__)


class Trigger(ABC):
    """Base class for behavior triggers."""

    @abstractmethod
    def check(self) -> bool:
        """Check if trigger condition is met."""
        ...

    @abstractmethod
    def reset(self) -> None:
        """Reset trigger state after firing."""
        ...


@dataclass
class TimeTrigger(Trigger):
    """Triggers based on time conditions."""

    start_hour: int = 6  # 6 AM
    end_hour: int = 11  # 11 AM
    days: list = field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])  # All days

    def check(self) -> bool:
        """Check if current time is within the window."""
        now = datetime.now()
        return (
            self.start_hour <= now.hour < self.end_hour
            and now.weekday() in self.days
        )

    def reset(self) -> None:
        """No state to reset."""
        pass


@dataclass
class DurationTrigger(Trigger):
    """Triggers after a duration of continuous activity."""

    threshold: timedelta = field(default_factory=lambda: timedelta(hours=2))
    activity_start: Optional[datetime] = None
    _fired: bool = False

    def start_tracking(self) -> None:
        """Start tracking activity."""
        if self.activity_start is None:
            self.activity_start = datetime.now()
            logger.debug("Duration tracking started")

    def stop_tracking(self) -> None:
        """Stop tracking activity."""
        self.activity_start = None
        self._fired = False
        logger.debug("Duration tracking stopped")

    def check(self) -> bool:
        """Check if threshold duration has been exceeded."""
        if self._fired or self.activity_start is None:
            return False

        elapsed = datetime.now() - self.activity_start
        if elapsed >= self.threshold:
            self._fired = True
            return True
        return False

    def reset(self) -> None:
        """Reset for next cycle."""
        self._fired = False
        # Keep activity_start to allow repeated reminders


@dataclass
class PatternTrigger(Trigger):
    """Triggers when a pattern is detected (e.g., in terminal output)."""

    patterns: list = field(default_factory=list)
    _last_match: Optional[str] = None
    _matched: bool = False

    def check_text(self, text: str) -> bool:
        """Check if text matches any pattern."""
        import re

        for pattern in self.patterns:
            if re.search(pattern, text, re.IGNORECASE):
                self._last_match = pattern
                self._matched = True
                logger.debug(f"Pattern matched: {pattern}")
                return True
        return False

    def check(self) -> bool:
        """Check if pattern was matched."""
        if self._matched:
            self._matched = False  # Auto-reset on check
            return True
        return False

    def reset(self) -> None:
        """Reset match state."""
        self._matched = False
        self._last_match = None


@dataclass
class PresenceTrigger(Trigger):
    """Triggers based on user presence detection."""

    presence_detected: bool = False
    last_seen: Optional[datetime] = None
    absence_threshold: timedelta = field(default_factory=lambda: timedelta(minutes=30))
    _returned: bool = False

    def update_presence(self, detected: bool) -> None:
        """Update presence state."""
        now = datetime.now()

        if detected and not self.presence_detected:
            # User just appeared
            if self.last_seen is not None:
                absence_duration = now - self.last_seen
                if absence_duration >= self.absence_threshold:
                    self._returned = True
                    logger.debug(f"User returned after {absence_duration}")

        if detected:
            self.last_seen = now

        self.presence_detected = detected

    def check(self) -> bool:
        """Check if user has returned after absence."""
        if self._returned:
            self._returned = False
            return True
        return False

    def reset(self) -> None:
        """Reset return state."""
        self._returned = False


@dataclass
class CompoundTrigger(Trigger):
    """Combines multiple triggers with AND/OR logic."""

    triggers: list = field(default_factory=list)
    require_all: bool = True  # AND vs OR

    def check(self) -> bool:
        """Check compound condition."""
        if not self.triggers:
            return False

        results = [t.check() for t in self.triggers]

        if self.require_all:
            return all(results)
        else:
            return any(results)

    def reset(self) -> None:
        """Reset all sub-triggers."""
        for trigger in self.triggers:
            trigger.reset()


@dataclass
class CooldownTrigger(Trigger):
    """Wraps another trigger with a cooldown period."""

    inner_trigger: Trigger = None
    cooldown: timedelta = field(default_factory=lambda: timedelta(hours=1))
    last_fired: Optional[datetime] = None

    def check(self) -> bool:
        """Check inner trigger with cooldown enforcement."""
        if self.inner_trigger is None:
            return False

        # Check cooldown
        if self.last_fired is not None:
            elapsed = datetime.now() - self.last_fired
            if elapsed < self.cooldown:
                return False

        # Check inner trigger
        if self.inner_trigger.check():
            self.last_fired = datetime.now()
            return True

        return False

    def reset(self) -> None:
        """Reset inner trigger."""
        if self.inner_trigger:
            self.inner_trigger.reset()


# === Pre-built trigger factories ===

def morning_window_trigger() -> TimeTrigger:
    """Create trigger for morning greeting window (6am-11am)."""
    return TimeTrigger(start_hour=6, end_hour=11)


def work_hours_trigger() -> TimeTrigger:
    """Create trigger for work hours (9am-6pm, weekdays)."""
    return TimeTrigger(start_hour=9, end_hour=18, days=[0, 1, 2, 3, 4])


def two_hour_work_trigger() -> DurationTrigger:
    """Create trigger for 2 hours of continuous work."""
    return DurationTrigger(threshold=timedelta(hours=2))


def build_success_trigger() -> PatternTrigger:
    """Create trigger for build success patterns."""
    return PatternTrigger(
        patterns=[
            r"BUILD SUCCESS",
            r"All tests passed",
            r"Tests:\s*\d+\s*passed",
            r"✓\s*\d+\s*tests?\s*passed",
            r"npm run build.*completed",
            r"Successfully built",
            r"Compilation successful",
        ]
    )


def build_failure_trigger() -> PatternTrigger:
    """Create trigger for build failure patterns."""
    return PatternTrigger(
        patterns=[
            r"BUILD FAILED",
            r"FAILED",
            r"Error:",
            r"error\[E\d+\]",
            r"Tests:\s*\d+\s*failed",
            r"✗\s*\d+\s*tests?\s*failed",
            r"Compilation failed",
        ]
    )
