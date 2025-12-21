"""
Music-reactive animations for DJ Reactor.

Maps audio features to robot movements with genre-specific styles.
"""

import time
import math
import random
import logging
from dataclasses import dataclass
from typing import Optional
from collections import deque
import numpy as np

from config import GenrePreset, GENRE_PRESETS
from audio_analyzer import AudioFeatures

logger = logging.getLogger(__name__)


def _get_head_pose_func():
    """Get the create_head_pose function if available."""
    try:
        from reachy_mini.utils import create_head_pose
        return create_head_pose
    except ImportError:
        return None


@dataclass
class MovementCommand:
    """A single movement command for the robot."""

    head_z: float = 0.0  # mm, vertical offset
    head_roll: float = 0.0  # degrees, tilt
    head_pitch: float = 0.0  # degrees, nod
    body_yaw: float = 0.0  # degrees, rotation
    antenna_left: float = 0.0  # -1 to 1
    antenna_right: float = 0.0  # -1 to 1
    duration: float = 0.1  # seconds
    priority: int = 0  # Higher priority commands override


class MovementMapper:
    """
    Maps audio features to robot movements based on genre preset.
    """

    def __init__(self, preset: GenrePreset, intensity: float = 0.7, sensitivity: float = 0.6):
        self.preset = preset
        self.intensity = intensity
        self.sensitivity = sensitivity

        # State tracking
        self.phase = 0.0
        self.last_beat_time = 0.0
        self.is_idle = True
        self.idle_phase = 0.0

        # Movement smoothing
        self.smooth_head_z = 0.0
        self.smooth_head_roll = 0.0
        self.smooth_body_yaw = 0.0
        self.smooth_antenna_l = 0.0
        self.smooth_antenna_r = 0.0

        # Recent features for pattern detection
        self.feature_history = deque(maxlen=30)

    def update_preset(self, preset: GenrePreset):
        """Change the active genre preset."""
        self.preset = preset
        logger.info(f"Movement preset changed to: {preset.display_name}")

    def update_intensity(self, intensity: float):
        """Update movement intensity (0-1)."""
        self.intensity = max(0.0, min(1.0, intensity))

    def update_sensitivity(self, sensitivity: float):
        """Update beat sensitivity (0-1)."""
        self.sensitivity = max(0.0, min(1.0, sensitivity))

    def process(self, features: AudioFeatures) -> MovementCommand:
        """
        Process audio features and return a movement command.
        """
        self.feature_history.append(features)

        # Check for silence/idle
        if features.is_silent:
            return self._get_idle_movement(features.timestamp)

        self.is_idle = False

        # Base movement from continuous features
        cmd = self._get_continuous_movement(features)

        # Add beat-triggered movements
        if features.beat_detected:
            beat_cmd = self._get_beat_movement(features)
            cmd = self._blend_commands(cmd, beat_cmd, 0.7)
            self.last_beat_time = features.timestamp

        # Apply intensity scaling
        cmd = self._scale_by_intensity(cmd)

        # Smooth the movement
        cmd = self._smooth_movement(cmd)

        # Add randomness
        cmd = self._add_variation(cmd)

        return cmd

    def _get_continuous_movement(self, features: AudioFeatures) -> MovementCommand:
        """Get movement from continuous audio features."""
        preset = self.preset

        # Body sway driven by bass
        body_sway = features.bass * preset.body_sway_amplitude * math.sin(features.beat_phase * 2 * math.pi)

        # Head movement driven by mid frequencies
        head_z = features.mid * preset.head_bob_amplitude * 0.5 * math.sin(features.beat_phase * 4 * math.pi)

        # Antenna activity from treble
        antenna_base = self._get_antenna_movement(features, preset)

        return MovementCommand(
            head_z=head_z,
            head_roll=0,
            head_pitch=0,
            body_yaw=body_sway,
            antenna_left=antenna_base[0],
            antenna_right=antenna_base[1],
            duration=0.05,
        )

    def _get_beat_movement(self, features: AudioFeatures) -> MovementCommand:
        """Get movement triggered by beat detection."""
        preset = self.preset
        strength = features.onset_strength * self.sensitivity

        # Head bob
        head_z = -preset.head_bob_amplitude * strength

        # Style-specific emphasis
        head_roll = 0.0
        head_pitch = 0.0

        if preset.emphasis_style == "headbang":
            head_pitch = -20 * strength
        elif preset.emphasis_style == "nod":
            head_pitch = -10 * strength
        elif preset.emphasis_style == "tilt":
            head_roll = random.choice([-1, 1]) * 15 * strength
        elif preset.emphasis_style == "freeze":
            # Momentary freeze before movement
            pass

        # Antenna flick
        antenna_l = 0.4 * strength
        antenna_r = 0.4 * strength

        return MovementCommand(
            head_z=head_z,
            head_roll=head_roll,
            head_pitch=head_pitch,
            body_yaw=0,
            antenna_left=antenna_l,
            antenna_right=antenna_r,
            duration=0.1,
            priority=1,
        )

    def _get_antenna_movement(self, features: AudioFeatures, preset: GenrePreset) -> tuple[float, float]:
        """Get antenna movement based on style and audio."""
        treble = features.treble * preset.antenna_amplitude
        phase = features.beat_phase

        if preset.antenna_style == "pulse":
            # Sync to beat
            value = treble * (1 - phase)
            return (value, value)

        elif preset.antenna_style == "flick":
            # Quick alternating flicks
            if features.beat_detected:
                side = random.choice([(0.6, -0.2), (-0.2, 0.6)])
                return (side[0] * treble * 2, side[1] * treble * 2)
            return (0, 0)

        elif preset.antenna_style == "sway":
            # Smooth swaying
            offset = math.sin(phase * 2 * math.pi) * treble
            return (offset * 0.3, -offset * 0.3)

        elif preset.antenna_style == "bounce":
            # Bouncy symmetric
            bounce = abs(math.sin(phase * 4 * math.pi)) * treble
            return (bounce * 0.4, bounce * 0.4)

        elif preset.antenna_style == "dramatic":
            # Big movements for rock
            if features.beat_detected:
                return (0.7 * treble, 0.7 * treble)
            return (-0.2 * treble, -0.2 * treble)

        return (0, 0)

    def _get_idle_movement(self, timestamp: float) -> MovementCommand:
        """Get subtle idle animation."""
        preset = self.preset
        self.is_idle = True
        self.idle_phase += 0.02  # Slow progression

        if preset.idle_style == "breathing":
            # Subtle expansion/contraction
            breath = math.sin(self.idle_phase) * 0.15
            return MovementCommand(
                antenna_left=breath,
                antenna_right=breath,
                head_z=breath * 3,
                duration=0.2,
            )

        elif preset.idle_style == "swaying":
            # Gentle side to side
            sway = math.sin(self.idle_phase * 0.5) * 15
            return MovementCommand(
                body_yaw=sway,
                head_roll=sway * 0.2,
                duration=0.3,
            )

        elif preset.idle_style == "nodding":
            # Slow nodding
            nod = math.sin(self.idle_phase * 0.7) * 5
            return MovementCommand(
                head_pitch=nod,
                duration=0.2,
            )

        elif preset.idle_style == "still":
            return MovementCommand(duration=0.5)

        return MovementCommand(duration=0.2)

    def _scale_by_intensity(self, cmd: MovementCommand) -> MovementCommand:
        """Scale movement by intensity setting."""
        scale = self.intensity
        return MovementCommand(
            head_z=cmd.head_z * scale,
            head_roll=cmd.head_roll * scale,
            head_pitch=cmd.head_pitch * scale,
            body_yaw=cmd.body_yaw * scale,
            antenna_left=cmd.antenna_left * scale,
            antenna_right=cmd.antenna_right * scale,
            duration=cmd.duration,
            priority=cmd.priority,
        )

    def _smooth_movement(self, cmd: MovementCommand) -> MovementCommand:
        """Apply smoothing to prevent jerky movements."""
        factor = self.preset.movement_smoothing

        self.smooth_head_z = self.smooth_head_z * factor + cmd.head_z * (1 - factor)
        self.smooth_head_roll = self.smooth_head_roll * factor + cmd.head_roll * (1 - factor)
        self.smooth_body_yaw = self.smooth_body_yaw * factor + cmd.body_yaw * (1 - factor)
        self.smooth_antenna_l = self.smooth_antenna_l * factor + cmd.antenna_left * (1 - factor)
        self.smooth_antenna_r = self.smooth_antenna_r * factor + cmd.antenna_right * (1 - factor)

        return MovementCommand(
            head_z=self.smooth_head_z,
            head_roll=self.smooth_head_roll,
            head_pitch=cmd.head_pitch,  # Keep pitch responsive
            body_yaw=self.smooth_body_yaw,
            antenna_left=self.smooth_antenna_l,
            antenna_right=self.smooth_antenna_r,
            duration=cmd.duration,
            priority=cmd.priority,
        )

    def _add_variation(self, cmd: MovementCommand) -> MovementCommand:
        """Add subtle random variation for more natural movement."""
        if self.preset.randomness <= 0:
            return cmd

        r = self.preset.randomness
        return MovementCommand(
            head_z=cmd.head_z + random.gauss(0, r * 2),
            head_roll=cmd.head_roll + random.gauss(0, r * 3),
            head_pitch=cmd.head_pitch + random.gauss(0, r * 2),
            body_yaw=cmd.body_yaw + random.gauss(0, r * 5),
            antenna_left=cmd.antenna_left + random.gauss(0, r * 0.1),
            antenna_right=cmd.antenna_right + random.gauss(0, r * 0.1),
            duration=cmd.duration,
            priority=cmd.priority,
        )

    def _blend_commands(self, cmd1: MovementCommand, cmd2: MovementCommand, weight: float) -> MovementCommand:
        """Blend two movement commands."""
        w1 = 1 - weight
        w2 = weight
        return MovementCommand(
            head_z=cmd1.head_z * w1 + cmd2.head_z * w2,
            head_roll=cmd1.head_roll * w1 + cmd2.head_roll * w2,
            head_pitch=cmd1.head_pitch * w1 + cmd2.head_pitch * w2,
            body_yaw=cmd1.body_yaw * w1 + cmd2.body_yaw * w2,
            antenna_left=cmd1.antenna_left * w1 + cmd2.antenna_left * w2,
            antenna_right=cmd1.antenna_right * w1 + cmd2.antenna_right * w2,
            duration=min(cmd1.duration, cmd2.duration),
            priority=max(cmd1.priority, cmd2.priority),
        )


class RobotController:
    """
    Executes movement commands on the Reachy Mini robot.
    """

    def __init__(self, robot):
        """
        Initialize with a robot instance.
        robot should be the actual ReachyMini instance (not ReachyConnection).
        """
        self.robot = robot
        self.create_head_pose = _get_head_pose_func()
        self.is_enabled = True
        self.last_command_time = 0.0

        # Safety limits
        self.max_head_z = 15  # mm
        self.max_head_roll = 40  # degrees
        self.max_head_pitch = 40  # degrees
        self.max_body_yaw = 60  # degrees
        self.max_antenna = 0.8  # radians

    def execute(self, cmd: MovementCommand):
        """Execute a movement command on the robot."""
        if not self.is_enabled or self.robot is None:
            return

        if self.create_head_pose is None:
            logger.warning("create_head_pose not available")
            return

        # Apply safety limits
        head_z = max(-self.max_head_z, min(self.max_head_z, cmd.head_z))
        head_roll = max(-self.max_head_roll, min(self.max_head_roll, cmd.head_roll))
        head_pitch = max(-self.max_head_pitch, min(self.max_head_pitch, cmd.head_pitch))
        body_yaw = max(-self.max_body_yaw, min(self.max_body_yaw, cmd.body_yaw))
        antenna_l = max(-self.max_antenna, min(self.max_antenna, cmd.antenna_left))
        antenna_r = max(-self.max_antenna, min(self.max_antenna, cmd.antenna_right))

        try:
            # Create head pose
            head_pose = self.create_head_pose(
                z=head_z,
                roll=head_roll,
                mm=True,
                degrees=True
            )

            # Execute movement
            self.robot.goto_target(
                head=head_pose,
                antennas=[antenna_l, antenna_r],
                body_yaw=np.deg2rad(body_yaw),
                duration=cmd.duration,
                method="minjerk"
            )

            self.last_command_time = time.time()

        except Exception as e:
            logger.error(f"Movement execution failed: {e}")

    def return_to_neutral(self, duration: float = 0.5):
        """Return robot to neutral position."""
        if self.robot is None or self.create_head_pose is None:
            return

        try:
            head_pose = self.create_head_pose(z=0, roll=0, mm=True, degrees=True)
            self.robot.goto_target(
                head=head_pose,
                antennas=[0, 0],
                body_yaw=0,
                duration=duration,
                method="minjerk"
            )
        except Exception as e:
            logger.error(f"Return to neutral failed: {e}")


# Standalone animations (for special events)

def wake_up_animation(robot, duration: float = 1.5):
    """Animation when music starts playing."""
    logger.info("Wake up animation")
    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        return

    try:
        # Start droopy
        robot.goto_target(
            head=create_head_pose(z=-5, roll=-10, mm=True, degrees=True),
            antennas=[-0.3, -0.3],
            duration=0.1
        )
        time.sleep(0.2)

        # Pop up alertly
        robot.goto_target(
            head=create_head_pose(z=5, roll=0, mm=True, degrees=True),
            antennas=[0.5, 0.5],
            duration=0.3
        )
        time.sleep(0.3)

        # Look around excitedly
        robot.goto_target(
            head=create_head_pose(z=0, roll=15, mm=True, degrees=True),
            duration=0.2
        )
        time.sleep(0.2)
        robot.goto_target(
            head=create_head_pose(z=0, roll=-15, mm=True, degrees=True),
            duration=0.2
        )
        time.sleep(0.2)

        # Settle to neutral ready position
        robot.goto_target(
            head=create_head_pose(z=0, roll=0, mm=True, degrees=True),
            antennas=[0.2, 0.2],
            duration=0.3
        )
    except Exception as e:
        logger.error(f"Wake up animation failed: {e}")


def wind_down_animation(robot, duration: float = 2.0):
    """Animation when music stops."""
    logger.info("Wind down animation")
    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        return

    try:
        # Satisfied nod
        robot.goto_target(
            head=create_head_pose(z=-3, roll=0, mm=True, degrees=True),
            duration=0.5
        )
        time.sleep(0.5)

        # Slow return to rest
        robot.goto_target(
            head=create_head_pose(z=0, roll=0, mm=True, degrees=True),
            antennas=[0, 0],
            body_yaw=0,
            duration=1.0
        )
    except Exception as e:
        logger.error(f"Wind down animation failed: {e}")


def drop_reaction(robot):
    """Dramatic reaction to a beat drop."""
    logger.info("Drop reaction!")
    create_head_pose = _get_head_pose_func()
    if create_head_pose is None:
        return

    try:
        # Quick duck
        robot.goto_target(
            head=create_head_pose(z=-10, mm=True, degrees=True),
            antennas=[-0.4, -0.4],
            duration=0.1
        )
        time.sleep(0.1)

        # Explosive rise
        robot.goto_target(
            head=create_head_pose(z=10, mm=True, degrees=True),
            antennas=[0.8, 0.8],
            body_yaw=np.deg2rad(30),
            duration=0.15
        )
        time.sleep(0.15)

        robot.goto_target(
            body_yaw=np.deg2rad(-30),
            duration=0.15
        )
        time.sleep(0.15)

    except Exception as e:
        logger.error(f"Drop reaction failed: {e}")
