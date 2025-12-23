"""Proactive behavior engine for Echo."""

from .triggers import (
    Trigger,
    TimeTrigger,
    DurationTrigger,
    PatternTrigger,
    PresenceTrigger,
    CompoundTrigger,
    CooldownTrigger,
    morning_window_trigger,
    work_hours_trigger,
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

from .engine import ProactiveEngine, RegisteredBehavior

__all__ = [
    # Triggers
    "Trigger",
    "TimeTrigger",
    "DurationTrigger",
    "PatternTrigger",
    "PresenceTrigger",
    "CompoundTrigger",
    "CooldownTrigger",
    "morning_window_trigger",
    "work_hours_trigger",
    "two_hour_work_trigger",
    "build_success_trigger",
    "build_failure_trigger",
    # Behaviors
    "Behavior",
    "BehaviorResult",
    "MorningGreetingBehavior",
    "WorkBreakReminderBehavior",
    "BuildCelebrationBehavior",
    "BuildFailureSupportBehavior",
    "ReturnGreetingBehavior",
    "get_default_behaviors",
    # Engine
    "ProactiveEngine",
    "RegisteredBehavior",
]
