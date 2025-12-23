"""
Proactive Behavior Engine

Orchestrates triggers and behaviors to make Echo proactive.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from threading import Thread, Event
from typing import Dict, List, Optional, Callable, TYPE_CHECKING

from .triggers import (
    Trigger,
    TimeTrigger,
    DurationTrigger,
    PatternTrigger,
    PresenceTrigger,
    CooldownTrigger,
    morning_window_trigger,
    two_hour_work_trigger,
    build_success_trigger,
    build_failure_trigger,
)
from .behaviors import (
    Behavior,
    BehaviorResult,
    MorningGreetingBehavior,
    WorkBreakReminderBehavior,
    BuildCelebrationBehavior,
    BuildFailureSupportBehavior,
    ReturnGreetingBehavior,
    get_default_behaviors,
)

if TYPE_CHECKING:
    from ..main import ReachyMiniEcho

logger = logging.getLogger(__name__)


@dataclass
class RegisteredBehavior:
    """A behavior with its trigger and configuration."""

    behavior: Behavior
    trigger: Trigger
    cooldown: timedelta = field(default_factory=lambda: timedelta(minutes=5))
    last_fired: Optional[datetime] = None
    enabled: bool = True

    def can_fire(self) -> bool:
        """Check if behavior can fire (not in cooldown)."""
        if not self.enabled:
            return False

        if self.last_fired is None:
            return True

        elapsed = datetime.now() - self.last_fired
        return elapsed >= self.cooldown

    def mark_fired(self) -> None:
        """Mark behavior as fired."""
        self.last_fired = datetime.now()


class ProactiveEngine:
    """
    Engine that monitors triggers and fires behaviors.

    Runs in a background thread, checking triggers periodically
    and executing behaviors when conditions are met.
    """

    def __init__(self, echo: "ReachyMiniEcho"):
        self.echo = echo
        self.behaviors: Dict[str, RegisteredBehavior] = {}
        self._running = False
        self._thread: Optional[Thread] = None
        self._stop_event = Event()
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None

        # Callbacks for UI notifications
        self._on_behavior_fired: Optional[Callable[[str, BehaviorResult], None]] = None

        # Sensors
        self._work_start: Optional[datetime] = None
        self._presence_detected = False
        self._last_presence_time: Optional[datetime] = None

    def register_behavior(
        self,
        behavior: Behavior,
        trigger: Trigger,
        cooldown: timedelta = timedelta(minutes=5),
    ) -> None:
        """Register a behavior with its trigger."""
        registered = RegisteredBehavior(
            behavior=behavior,
            trigger=trigger,
            cooldown=cooldown,
        )
        self.behaviors[behavior.name] = registered
        logger.info(f"Registered behavior: {behavior.name}")

    def register_defaults(self) -> None:
        """Register default behaviors with appropriate triggers."""

        # Morning greeting: time window + first appearance today
        self.register_behavior(
            MorningGreetingBehavior(),
            morning_window_trigger(),
            cooldown=timedelta(hours=12),
        )

        # Work break: after 2 hours of activity
        self.register_behavior(
            WorkBreakReminderBehavior(),
            two_hour_work_trigger(),
            cooldown=timedelta(hours=1),
        )

        # Build celebration: success pattern detected
        self.register_behavior(
            BuildCelebrationBehavior(),
            build_success_trigger(),
            cooldown=timedelta(minutes=2),
        )

        # Build failure support: failure pattern detected
        self.register_behavior(
            BuildFailureSupportBehavior(),
            build_failure_trigger(),
            cooldown=timedelta(minutes=5),
        )

        # Return greeting: presence after absence
        return_trigger = PresenceTrigger(absence_threshold=timedelta(minutes=30))
        self.register_behavior(
            ReturnGreetingBehavior(),
            return_trigger,
            cooldown=timedelta(hours=1),
        )

        logger.info(f"Registered {len(self.behaviors)} default behaviors")

    def set_behavior_enabled(self, name: str, enabled: bool) -> None:
        """Enable or disable a specific behavior."""
        if name in self.behaviors:
            self.behaviors[name].enabled = enabled
            logger.info(f"Behavior {name} {'enabled' if enabled else 'disabled'}")

    def on_behavior_fired(self, callback: Callable[[str, BehaviorResult], None]) -> None:
        """Set callback for when behaviors fire."""
        self._on_behavior_fired = callback

    # === Sensor Updates ===

    def update_presence(self, detected: bool) -> None:
        """Update presence detection state."""
        self._presence_detected = detected

        if detected:
            self._last_presence_time = datetime.now()

            # Start work tracking if not already
            if self._work_start is None:
                self._work_start = datetime.now()
                logger.debug("Work session started")

        # Update presence triggers
        for reg in self.behaviors.values():
            if isinstance(reg.trigger, PresenceTrigger):
                reg.trigger.update_presence(detected)

    def update_terminal_output(self, text: str) -> None:
        """Process terminal output for pattern triggers."""
        for reg in self.behaviors.values():
            if isinstance(reg.trigger, PatternTrigger):
                reg.trigger.check_text(text)

    def reset_work_session(self) -> None:
        """Reset work session tracking (e.g., after break)."""
        self._work_start = None

        for reg in self.behaviors.values():
            if isinstance(reg.trigger, DurationTrigger):
                reg.trigger.stop_tracking()

        logger.debug("Work session reset")

    # === Engine Control ===

    def start(self) -> None:
        """Start the proactive engine."""
        if self._running:
            logger.warning("Engine already running")
            return

        self._running = True
        self._stop_event.clear()
        self._thread = Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info("Proactive engine started")

    def stop(self) -> None:
        """Stop the proactive engine."""
        self._running = False
        self._stop_event.set()

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)

        logger.info("Proactive engine stopped")

    def _run_loop(self) -> None:
        """Main engine loop."""
        # Create event loop for this thread
        self._event_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._event_loop)

        while self._running and not self._stop_event.is_set():
            try:
                self._check_triggers()
            except Exception as e:
                logger.error(f"Error in proactive engine: {e}")

            # Check every second
            self._stop_event.wait(1.0)

        self._event_loop.close()

    def _check_triggers(self) -> None:
        """Check all triggers and fire behaviors as needed."""

        # Update duration triggers with work time
        if self._work_start:
            for reg in self.behaviors.values():
                if isinstance(reg.trigger, DurationTrigger):
                    reg.trigger.start_tracking()

        # Check each behavior
        for name, reg in self.behaviors.items():
            if not reg.can_fire():
                continue

            if reg.trigger.check():
                logger.info(f"Trigger fired for behavior: {name}")
                self._fire_behavior(reg)

    def _fire_behavior(self, reg: RegisteredBehavior) -> None:
        """Execute a behavior."""
        try:
            # Run async behavior in the event loop
            future = asyncio.run_coroutine_threadsafe(
                reg.behavior.execute(self.echo),
                self._event_loop,
            )
            result = future.result(timeout=10.0)

            if result.success:
                reg.mark_fired()
                reg.trigger.reset()

                logger.info(f"Behavior {reg.behavior.name} executed: {result.message}")

                # Notify callback
                if self._on_behavior_fired:
                    self._on_behavior_fired(reg.behavior.name, result)

        except Exception as e:
            logger.error(f"Behavior {reg.behavior.name} failed: {e}")

    # === Status ===

    def get_status(self) -> dict:
        """Get engine status."""
        return {
            "running": self._running,
            "behaviors": {
                name: {
                    "enabled": reg.enabled,
                    "last_fired": reg.last_fired.isoformat() if reg.last_fired else None,
                    "can_fire": reg.can_fire(),
                }
                for name, reg in self.behaviors.items()
            },
            "work_session_start": self._work_start.isoformat() if self._work_start else None,
            "presence_detected": self._presence_detected,
        }
