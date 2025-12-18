"""
Configuration for Focus Guardian app.
"""

from dataclasses import dataclass, field
from typing import Optional
import json
import os

# Defaults
DEFAULT_SESSION_DURATION_MINUTES = 25
DEFAULT_BREAK_DURATION_MINUTES = 5
DEFAULT_DISTRACTION_THRESHOLD_SECONDS = 10
DEFAULT_NUDGE_COOLDOWN_SECONDS = 30
DEFAULT_NUDGE_INTENSITY = "medium"  # low, medium, high


@dataclass
class FocusConfig:
    """Configuration for Focus Guardian sessions."""

    # Session settings
    session_duration_minutes: int = DEFAULT_SESSION_DURATION_MINUTES
    break_duration_minutes: int = DEFAULT_BREAK_DURATION_MINUTES

    # Attention monitoring
    distraction_threshold_seconds: float = DEFAULT_DISTRACTION_THRESHOLD_SECONDS
    nudge_cooldown_seconds: float = DEFAULT_NUDGE_COOLDOWN_SECONDS
    nudge_intensity: str = DEFAULT_NUDGE_INTENSITY
    enable_phone_detection: bool = True

    # Robot connection
    robot_host: str = "localhost"
    simulation_mode: bool = False

    # UI settings
    enable_sound: bool = True
    enable_camera_preview: bool = True
    dark_mode: bool = False

    # Vision settings
    vision_backend: str = "mediapipe"  # mediapipe, smolvlm, mock
    camera_index: int = 0
    frame_skip: int = 2  # Process every Nth frame

    def save(self, path: str = "config.json"):
        """Save configuration to JSON file."""
        with open(path, "w") as f:
            json.dump(self.__dict__, f, indent=2)

    @classmethod
    def load(cls, path: str = "config.json") -> "FocusConfig":
        """Load configuration from JSON file."""
        if not os.path.exists(path):
            return cls()
        with open(path, "r") as f:
            data = json.load(f)
        return cls(**data)

    @classmethod
    def from_env(cls) -> "FocusConfig":
        """Create configuration from environment variables."""
        return cls(
            session_duration_minutes=int(os.getenv("FOCUS_SESSION_DURATION", DEFAULT_SESSION_DURATION_MINUTES)),
            distraction_threshold_seconds=float(os.getenv("FOCUS_DISTRACTION_THRESHOLD", DEFAULT_DISTRACTION_THRESHOLD_SECONDS)),
            simulation_mode=os.getenv("FOCUS_SIMULATION", "false").lower() == "true",
            robot_host=os.getenv("REACHY_HOST", "localhost"),
            vision_backend=os.getenv("FOCUS_VISION_BACKEND", "mediapipe"),
        )


# Nudge intensity mappings
NUDGE_INTENSITY_MAP = {
    "low": {
        "first_nudge": "attention_wiggle",
        "second_nudge": "attention_wiggle",
        "escalated_nudge": "disappointed_shake",
        "shake_intensity": 0.3,
    },
    "medium": {
        "first_nudge": "attention_wiggle",
        "second_nudge": "disappointed_shake",
        "escalated_nudge": "disappointed_shake",
        "shake_intensity": 0.7,
    },
    "high": {
        "first_nudge": "disappointed_shake",
        "second_nudge": "disappointed_shake",
        "escalated_nudge": "disappointed_shake",
        "shake_intensity": 1.0,
    },
}


def get_nudge_action(intensity: str, nudge_count: int) -> tuple[str, float]:
    """
    Get the appropriate nudge action based on intensity and count.

    Returns:
        Tuple of (animation_name, intensity_value)
    """
    mapping = NUDGE_INTENSITY_MAP.get(intensity, NUDGE_INTENSITY_MAP["medium"])

    if nudge_count == 0:
        return mapping["first_nudge"], 0.5
    elif nudge_count == 1:
        return mapping["second_nudge"], mapping["shake_intensity"]
    else:
        return mapping["escalated_nudge"], mapping["shake_intensity"]
