"""
Pre-built animations for Reachy Mini using the real SDK.
"""

import time
import logging

logger = logging.getLogger(__name__)


def _get_head_pose_func():
    """Get the create_head_pose function if available."""
    try:
        from reachy_mini.utils import create_head_pose
        return create_head_pose
    except ImportError:
        return None


def victory_dance(robot, duration: float = 3.0):
    """
    Celebratory dance animation for completing focus sessions.
    """
    logger.info("Performing victory dance!")

    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        logger.warning("reachy_mini not available, skipping animation")
        return

    cycles = int(duration / 0.6)
    for i in range(cycles):
        # Antenna wiggle + head bob
        robot.goto_target(antennas=[0.6, -0.6], duration=0.15)
        time.sleep(0.15)
        robot.goto_target(antennas=[-0.6, 0.6], duration=0.15)
        time.sleep(0.15)
        robot.goto_target(
            head=create_head_pose(z=5, mm=True, degrees=True),
            duration=0.15
        )
        time.sleep(0.15)
        robot.goto_target(
            head=create_head_pose(z=-5, mm=True, degrees=True),
            duration=0.15
        )
        time.sleep(0.15)

    # Return to neutral
    robot.goto_target(antennas=[0, 0], duration=0.3)
    robot.goto_target(
        head=create_head_pose(z=0, roll=0, mm=True, degrees=True),
        duration=0.3
    )


def disappointed_shake(robot, intensity: float = 1.0):
    """
    Disappointed head shake for when user loses focus.
    """
    logger.info(f"Disappointed shake (intensity: {intensity})")

    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        logger.warning("reachy_mini not available, skipping animation")
        return

    amplitude = 15 * intensity
    speed = 0.15

    for _ in range(3):
        robot.goto_target(
            head=create_head_pose(roll=amplitude, mm=True, degrees=True),
            duration=speed
        )
        time.sleep(speed)
        robot.goto_target(
            head=create_head_pose(roll=-amplitude, mm=True, degrees=True),
            duration=speed
        )
        time.sleep(speed)

    # Droopy antennas
    robot.goto_target(antennas=[-0.5, -0.5], duration=0.3)
    time.sleep(0.5)

    # Return to neutral
    robot.goto_target(
        head=create_head_pose(roll=0, mm=True, degrees=True),
        duration=0.2
    )
    robot.goto_target(antennas=[0, 0], duration=0.3)


def attention_wiggle(robot):
    """
    Quick attention-getting wiggle to nudge user back to focus.
    """
    logger.info("Attention wiggle")

    # Quick antenna flick
    for _ in range(2):
        robot.goto_target(antennas=[0.5, 0.5], duration=0.1)
        time.sleep(0.12)
        robot.goto_target(antennas=[0, 0], duration=0.1)
        time.sleep(0.12)


def idle_breathing(robot, cycles: int = 1):
    """
    Subtle idle animation to show the robot is 'alive' and watching.
    """
    for _ in range(cycles):
        robot.goto_target(antennas=[0.1, 0.1], duration=1.5)
        time.sleep(1.5)
        robot.goto_target(antennas=[-0.1, -0.1], duration=1.5)
        time.sleep(1.5)


def focus_mode_enter(robot):
    """Animation when entering focus mode."""
    logger.info("Entering focus mode")

    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        logger.warning("reachy_mini not available, skipping animation")
        return

    # Alert posture - head slightly up, antennas perked
    robot.goto_target(
        head=create_head_pose(z=-3, mm=True, degrees=True),
        duration=0.5
    )
    robot.goto_target(antennas=[0.3, 0.3], duration=0.3)
    time.sleep(0.5)


def focus_mode_exit(robot):
    """Animation when exiting focus mode."""
    logger.info("Exiting focus mode")

    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        logger.warning("reachy_mini not available, skipping animation")
        return

    # Return to neutral
    robot.goto_target(
        head=create_head_pose(z=0, roll=0, mm=True, degrees=True),
        duration=0.5
    )
    robot.goto_target(antennas=[0, 0], duration=0.3)
