"""
Configuration for DJ Reactor app.
"""

from dataclasses import dataclass, field
from typing import Optional
import json
import os

# Audio defaults
DEFAULT_SAMPLE_RATE = 44100
DEFAULT_CHUNK_SIZE = 2048  # ~46ms at 44100Hz
DEFAULT_DEVICE_INDEX = None  # Use system default

# Movement defaults
DEFAULT_GENRE = "electronic"
DEFAULT_INTENSITY = 0.7
DEFAULT_SENSITIVITY = 0.6

# Frequency band ranges (Hz)
BASS_RANGE = (20, 250)
MID_RANGE = (250, 2000)
TREBLE_RANGE = (2000, 12000)


@dataclass
class GenrePreset:
    """Movement characteristics for a music genre."""

    name: str
    display_name: str

    # Head bob
    head_bob_amplitude: float = 8.0  # mm
    head_bob_speed: float = 1.0  # multiplier

    # Body sway
    body_sway_amplitude: float = 20.0  # degrees
    body_sway_speed: float = 1.0

    # Antenna behavior
    antenna_style: str = "pulse"  # pulse, flick, sway, bounce, dramatic
    antenna_amplitude: float = 0.5  # 0-1

    # Special behaviors
    emphasis_style: str = "nod"  # headbang, nod, tilt, freeze
    idle_style: str = "breathing"  # breathing, swaying, nodding, still

    # Variation
    randomness: float = 0.2  # 0-1
    movement_smoothing: float = 0.3  # 0-1, higher = smoother


# Predefined genre presets
GENRE_PRESETS = {
    "rock": GenrePreset(
        name="rock",
        display_name="Rock",
        head_bob_amplitude=12.0,
        head_bob_speed=0.8,
        body_sway_amplitude=15.0,
        antenna_style="dramatic",
        antenna_amplitude=0.7,
        emphasis_style="headbang",
        idle_style="nodding",
        randomness=0.3,
    ),
    "electronic": GenrePreset(
        name="electronic",
        display_name="Electronic/EDM",
        head_bob_amplitude=10.0,
        head_bob_speed=1.0,
        body_sway_amplitude=25.0,
        body_sway_speed=0.8,
        antenna_style="pulse",
        antenna_amplitude=0.6,
        emphasis_style="nod",
        idle_style="breathing",
        randomness=0.15,
        movement_smoothing=0.4,
    ),
    "jazz": GenrePreset(
        name="jazz",
        display_name="Jazz",
        head_bob_amplitude=5.0,
        head_bob_speed=1.2,
        body_sway_amplitude=30.0,
        body_sway_speed=1.5,
        antenna_style="sway",
        antenna_amplitude=0.3,
        emphasis_style="tilt",
        idle_style="swaying",
        randomness=0.4,
        movement_smoothing=0.6,
    ),
    "pop": GenrePreset(
        name="pop",
        display_name="Pop",
        head_bob_amplitude=8.0,
        head_bob_speed=1.0,
        body_sway_amplitude=20.0,
        antenna_style="bounce",
        antenna_amplitude=0.5,
        emphasis_style="nod",
        idle_style="breathing",
        randomness=0.25,
    ),
    "classical": GenrePreset(
        name="classical",
        display_name="Classical",
        head_bob_amplitude=3.0,
        head_bob_speed=1.5,
        body_sway_amplitude=35.0,
        body_sway_speed=2.0,
        antenna_style="sway",
        antenna_amplitude=0.2,
        emphasis_style="tilt",
        idle_style="breathing",
        randomness=0.2,
        movement_smoothing=0.7,
    ),
    "hiphop": GenrePreset(
        name="hiphop",
        display_name="Hip-Hop",
        head_bob_amplitude=10.0,
        head_bob_speed=0.9,
        body_sway_amplitude=15.0,
        antenna_style="flick",
        antenna_amplitude=0.5,
        emphasis_style="freeze",
        idle_style="nodding",
        randomness=0.3,
    ),
    "chill": GenrePreset(
        name="chill",
        display_name="Chill/Ambient",
        head_bob_amplitude=4.0,
        head_bob_speed=1.5,
        body_sway_amplitude=25.0,
        body_sway_speed=2.0,
        antenna_style="sway",
        antenna_amplitude=0.2,
        emphasis_style="tilt",
        idle_style="breathing",
        randomness=0.15,
        movement_smoothing=0.8,
    ),
}


@dataclass
class DJReactorConfig:
    """Configuration for DJ Reactor sessions."""

    # Audio settings
    sample_rate: int = DEFAULT_SAMPLE_RATE
    chunk_size: int = DEFAULT_CHUNK_SIZE
    device_index: Optional[int] = DEFAULT_DEVICE_INDEX

    # Movement settings
    genre: str = DEFAULT_GENRE
    intensity: float = DEFAULT_INTENSITY  # 0-1
    sensitivity: float = DEFAULT_SENSITIVITY  # 0-1

    # Beat detection
    onset_threshold: float = 0.8
    min_beat_interval: float = 0.15  # seconds

    # Robot connection
    robot_host: str = "localhost"
    robot_port: int = 8000

    # UI settings
    show_waveform: bool = True
    show_spectrum: bool = True
    update_rate_hz: int = 30

    def get_preset(self) -> GenrePreset:
        """Get the current genre preset."""
        return GENRE_PRESETS.get(self.genre, GENRE_PRESETS["electronic"])

    def save(self, path: str = "config.json"):
        """Save configuration to JSON file."""
        with open(path, "w") as f:
            json.dump(self.__dict__, f, indent=2)

    @classmethod
    def load(cls, path: str = "config.json") -> "DJReactorConfig":
        """Load configuration from JSON file."""
        if not os.path.exists(path):
            return cls()
        with open(path, "r") as f:
            data = json.load(f)
        return cls(**data)

    @classmethod
    def from_env(cls) -> "DJReactorConfig":
        """Create configuration from environment variables."""
        return cls(
            genre=os.getenv("DJ_GENRE", DEFAULT_GENRE),
            intensity=float(os.getenv("DJ_INTENSITY", DEFAULT_INTENSITY)),
            sensitivity=float(os.getenv("DJ_SENSITIVITY", DEFAULT_SENSITIVITY)),
            robot_host=os.getenv("REACHY_HOST", "localhost"),
        )


def get_available_genres() -> list[tuple[str, str]]:
    """Get list of available genres as (id, display_name) tuples."""
    return [(preset.name, preset.display_name) for preset in GENRE_PRESETS.values()]
