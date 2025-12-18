"""
Expression management for Reachy Mini LED eyes and body language.
"""

from enum import Enum
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .robot import SimulatedReachy


class Expression(Enum):
    """Pre-defined expressions for Reachy Mini."""
    NEUTRAL = "neutral"
    HAPPY = "happy"
    FOCUSED = "focused"
    DISAPPOINTED = "disappointed"
    ENCOURAGING = "encouraging"
    ALERT = "alert"
    SLEEPY = "sleepy"
    CELEBRATING = "celebrating"


@dataclass
class ExpressionConfig:
    """Configuration for an expression."""
    led_color: tuple[int, int, int]
    antenna_position: tuple[float, float]  # left, right
    head_pitch: float = 0
    head_yaw: float = 0


EXPRESSION_CONFIGS = {
    Expression.NEUTRAL: ExpressionConfig(
        led_color=(255, 255, 255),
        antenna_position=(0, 0),
    ),
    Expression.HAPPY: ExpressionConfig(
        led_color=(0, 255, 100),
        antenna_position=(25, 25),
        head_pitch=-5,
    ),
    Expression.FOCUSED: ExpressionConfig(
        led_color=(0, 150, 255),
        antenna_position=(15, 15),
        head_pitch=-3,
    ),
    Expression.DISAPPOINTED: ExpressionConfig(
        led_color=(255, 100, 0),
        antenna_position=(-25, -25),
        head_pitch=10,
    ),
    Expression.ENCOURAGING: ExpressionConfig(
        led_color=(255, 200, 0),
        antenna_position=(20, 20),
        head_pitch=-5,
        head_yaw=5,
    ),
    Expression.ALERT: ExpressionConfig(
        led_color=(255, 255, 0),
        antenna_position=(40, 40),
        head_pitch=-10,
    ),
    Expression.SLEEPY: ExpressionConfig(
        led_color=(100, 100, 150),
        antenna_position=(-40, -40),
        head_pitch=15,
    ),
    Expression.CELEBRATING: ExpressionConfig(
        led_color=(0, 255, 0),
        antenna_position=(45, 45),
        head_pitch=-10,
    ),
}


def set_expression(robot: "SimulatedReachy", expression: Expression, duration: float = 0.5):
    """
    Set the robot's expression.

    Args:
        robot: Reachy robot instance
        expression: Expression enum value
        duration: Time to transition to expression
    """
    config = EXPRESSION_CONFIGS.get(expression, EXPRESSION_CONFIGS[Expression.NEUTRAL])

    robot.set_led_color(*config.led_color)
    robot.move_antennas(
        left=config.antenna_position[0],
        right=config.antenna_position[1],
        duration=duration
    )
    robot.move_head(
        pitch=config.head_pitch,
        yaw=config.head_yaw,
        duration=duration
    )
