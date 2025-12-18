"""
Reachy Mini utility functions for robot control.

Provides common abstractions for:
- Connection management
- Movement primitives
- Expression animations
- Audio playback
"""

from .robot import ReachyConnection, get_robot
from .animations import victory_dance, disappointed_shake, attention_wiggle
from .expressions import set_expression, Expression

__all__ = [
    "ReachyConnection",
    "get_robot",
    "victory_dance",
    "disappointed_shake",
    "attention_wiggle",
    "set_expression",
    "Expression",
]
