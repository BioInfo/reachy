"""
Proactive Behaviors

Define what Echo does when triggers fire.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Callable, Optional, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from ..main import ReachyMiniEcho

logger = logging.getLogger(__name__)


@dataclass
class BehaviorResult:
    """Result of a behavior execution."""

    success: bool
    message: Optional[str] = None
    data: dict = field(default_factory=dict)


class Behavior(ABC):
    """Base class for proactive behaviors."""

    name: str = "unnamed"
    description: str = ""
    priority: int = 50  # Higher = more important
    enabled: bool = True

    @abstractmethod
    async def execute(self, echo: "ReachyMiniEcho") -> BehaviorResult:
        """
        Execute the behavior.

        Args:
            echo: The Echo app instance for robot control and state access

        Returns:
            BehaviorResult with success status and optional message
        """
        ...


class MorningGreetingBehavior(Behavior):
    """
    Greet the user when they first sit down in the morning.

    Personalizes greeting based on:
    - User's name (if known)
    - Day of week
    - Recent context from memory
    """

    name = "morning_greeting"
    description = "Greet user when they first appear in the morning"
    priority = 80

    async def execute(self, echo: "ReachyMiniEcho") -> BehaviorResult:
        """Execute morning greeting."""
        logger.info("Executing morning greeting")

        # Check if already greeted today
        if echo.memory and echo.memory.storage.has_greeted_today():
            logger.debug("Already greeted today, skipping")
            return BehaviorResult(success=False, message="Already greeted today")

        # Build personalized greeting
        greeting = self._build_greeting(echo)

        # Animate greeting
        if echo.reachy:
            try:
                # Wake up animation
                echo.reachy.goto_target(
                    antennas=[0.6, 0.6],
                    duration=0.4,
                )
                # Happy wiggle
                echo.reachy.goto_target(
                    antennas=[0.4, 0.7],
                    duration=0.2,
                )
                echo.reachy.goto_target(
                    antennas=[0.7, 0.4],
                    duration=0.2,
                )
                echo.reachy.goto_target(
                    antennas=[0.5, 0.5],
                    duration=0.3,
                )
            except Exception as e:
                logger.warning(f"Greeting animation failed: {e}")

        # Mark as greeted
        if echo.memory:
            echo.memory.mark_greeted()

        return BehaviorResult(
            success=True,
            message=greeting,
            data={"type": "morning_greeting"},
        )

    def _build_greeting(self, echo: "ReachyMiniEcho") -> str:
        """Build personalized greeting message."""
        now = datetime.now()
        day_name = now.strftime("%A")

        # Get user name
        name = echo.user_name or (
            echo.memory.get_user_name() if echo.memory else None
        )

        # Base greeting
        if name:
            greeting = f"Good morning, {name}!"
        else:
            greeting = "Good morning!"

        # Add day-specific flavor
        if now.weekday() == 0:  # Monday
            greeting += " Hope you had a great weekend."
        elif now.weekday() == 4:  # Friday
            greeting += " Happy Friday!"
        elif now.weekday() in [5, 6]:  # Weekend
            greeting = greeting.replace("Good morning", "Good morning")
            greeting += " Working on the weekend?"

        # Add context from memory
        if echo.memory:
            recent = echo.memory.storage.get_recent_sessions(limit=1)
            if recent and recent[0].summary:
                greeting += f" Last time we talked about {recent[0].summary}."

        return greeting


class WorkBreakReminderBehavior(Behavior):
    """
    Remind user to take a break after extended work.

    Triggers after 2+ hours of continuous activity.
    """

    name = "work_break_reminder"
    description = "Suggest a break after extended work"
    priority = 60

    async def execute(self, echo: "ReachyMiniEcho") -> BehaviorResult:
        """Execute break reminder."""
        logger.info("Executing work break reminder")

        # Build message
        messages = [
            "You've been at it for a while. How about a quick stretch?",
            "Time for a short break! Your eyes and back will thank you.",
            "Hey, you've been focused for a while. Maybe grab some water?",
            "Great focus! But don't forget to take care of yourself. Break time?",
        ]

        # Pick message based on time to add variety
        import random
        message = random.choice(messages)

        # Animate gentle interruption
        if echo.reachy:
            try:
                # Get attention animation
                echo.reachy.goto_target(
                    antennas=[0.3, 0.3],
                    duration=0.3,
                )
                # Gentle head tilt
                echo.reachy.goto_target(
                    head={"roll": 10},
                    duration=0.4,
                )
                echo.reachy.goto_target(
                    head={"roll": 0},
                    duration=0.4,
                )
                # Inviting antenna gesture
                echo.reachy.goto_target(
                    antennas=[0.5, 0.5],
                    duration=0.3,
                )
            except Exception as e:
                logger.warning(f"Break reminder animation failed: {e}")

        return BehaviorResult(
            success=True,
            message=message,
            data={"type": "work_break"},
        )


class BuildCelebrationBehavior(Behavior):
    """
    Celebrate when a build succeeds.

    Triggered by detecting success patterns in terminal output.
    """

    name = "build_celebration"
    description = "Celebrate successful builds"
    priority = 70

    async def execute(self, echo: "ReachyMiniEcho") -> BehaviorResult:
        """Execute build celebration."""
        logger.info("Executing build celebration")

        # Celebration messages
        messages = [
            "Nice! Build passed!",
            "Ship it! That build looks good!",
            "Tests passing, code compiling. You're on fire!",
            "Another successful build. Keep it going!",
        ]

        import random
        message = random.choice(messages)

        # Celebration animation
        if echo.reachy:
            try:
                # Excited antenna dance
                for _ in range(2):
                    echo.reachy.goto_target(
                        antennas=[0.8, 0.2],
                        duration=0.15,
                    )
                    echo.reachy.goto_target(
                        antennas=[0.2, 0.8],
                        duration=0.15,
                    )

                # Victory pose
                echo.reachy.goto_target(
                    antennas=[0.7, 0.7],
                    head={"z": 5},  # Head up slightly
                    duration=0.3,
                )

                # Return to neutral
                echo.reachy.goto_target(
                    antennas=[0.3, 0.3],
                    head={"z": 0},
                    duration=0.4,
                )
            except Exception as e:
                logger.warning(f"Celebration animation failed: {e}")

        return BehaviorResult(
            success=True,
            message=message,
            data={"type": "build_celebration"},
        )


class BuildFailureSupportBehavior(Behavior):
    """
    Offer support when a build fails.

    Triggered by detecting failure patterns in terminal output.
    """

    name = "build_failure_support"
    description = "Offer support when builds fail"
    priority = 65

    async def execute(self, echo: "ReachyMiniEcho") -> BehaviorResult:
        """Execute failure support."""
        logger.info("Executing build failure support")

        messages = [
            "Oof, that one didn't work. Want to talk through it?",
            "Build failed, but you've got this. Take a breath.",
            "Error detected. Sometimes stepping away helps.",
            "That didn't pass, but every bug is a learning opportunity.",
        ]

        import random
        message = random.choice(messages)

        # Sympathetic animation
        if echo.reachy:
            try:
                # Sympathetic droop
                echo.reachy.goto_target(
                    antennas=[0.1, 0.1],
                    head={"roll": -5},
                    duration=0.5,
                )
                # Supportive recovery
                echo.reachy.goto_target(
                    antennas=[0.3, 0.3],
                    head={"roll": 0},
                    duration=0.4,
                )
            except Exception as e:
                logger.warning(f"Failure support animation failed: {e}")

        return BehaviorResult(
            success=True,
            message=message,
            data={"type": "build_failure"},
        )


class ReturnGreetingBehavior(Behavior):
    """
    Welcome user back after they've been away.

    Triggers when user returns after 30+ minutes absence.
    """

    name = "return_greeting"
    description = "Welcome user back after absence"
    priority = 55

    async def execute(self, echo: "ReachyMiniEcho") -> BehaviorResult:
        """Execute return greeting."""
        logger.info("Executing return greeting")

        messages = [
            "Welcome back!",
            "Hey, you're back! Ready to continue?",
            "Good to see you again!",
            "Back at it? Let's go!",
        ]

        import random
        message = random.choice(messages)

        # Welcome animation
        if echo.reachy:
            try:
                # Perk up
                echo.reachy.goto_target(
                    antennas=[0.5, 0.5],
                    duration=0.3,
                )
                # Little wave
                echo.reachy.goto_target(
                    antennas=[0.6, 0.3],
                    duration=0.2,
                )
                echo.reachy.goto_target(
                    antennas=[0.3, 0.6],
                    duration=0.2,
                )
                echo.reachy.goto_target(
                    antennas=[0.4, 0.4],
                    duration=0.3,
                )
            except Exception as e:
                logger.warning(f"Return greeting animation failed: {e}")

        return BehaviorResult(
            success=True,
            message=message,
            data={"type": "return_greeting"},
        )


# === Behavior registry ===

def get_default_behaviors() -> list:
    """Get list of default behaviors for Echo."""
    return [
        MorningGreetingBehavior(),
        WorkBreakReminderBehavior(),
        BuildCelebrationBehavior(),
        BuildFailureSupportBehavior(),
        ReturnGreetingBehavior(),
    ]
