"""Genre movement presets — pure data, no robot.

Each preset shapes how the `DanceController` maps audio to motion: how big the
head bob and body sway are, how bouncy the antennas, and how a detected beat is
emphasized (headbang / nod / tilt). Ported from DJ Reactor v1; kept as plain data
so it's trivially testable and editable.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GenrePreset:
    name: str
    display_name: str
    head_bob_amplitude: float = 8.0
    head_bob_speed: float = 1.0
    body_sway_amplitude: float = 20.0
    body_sway_speed: float = 1.0
    antenna_amplitude: float = 0.5
    emphasis_style: str = "nod"        # headbang | nod | tilt
    movement_smoothing: float = 0.3    # 0..1, higher = smoother / laggier


GENRE_PRESETS: dict[str, GenrePreset] = {
    "electronic": GenrePreset(
        name="electronic", display_name="Electronic / EDM",
        head_bob_amplitude=15.0, head_bob_speed=1.0,
        body_sway_amplitude=75.0, body_sway_speed=1.0,
        antenna_amplitude=0.9, emphasis_style="nod", movement_smoothing=0.25,
    ),
    "rock": GenrePreset(
        name="rock", display_name="Rock",
        head_bob_amplitude=18.0, head_bob_speed=1.0,
        body_sway_amplitude=70.0, antenna_amplitude=1.0,
        emphasis_style="headbang", movement_smoothing=0.2,
    ),
    "hiphop": GenrePreset(
        name="hiphop", display_name="Hip-Hop",
        head_bob_amplitude=16.0, head_bob_speed=0.9,
        body_sway_amplitude=65.0, antenna_amplitude=0.8,
        emphasis_style="nod", movement_smoothing=0.2,
    ),
    "pop": GenrePreset(
        name="pop", display_name="Pop",
        head_bob_amplitude=14.0, head_bob_speed=1.0,
        body_sway_amplitude=70.0, antenna_amplitude=0.8,
        emphasis_style="nod", movement_smoothing=0.25,
    ),
    "jazz": GenrePreset(
        name="jazz", display_name="Jazz",
        head_bob_amplitude=12.0, head_bob_speed=1.2,
        body_sway_amplitude=80.0, body_sway_speed=1.2,
        antenna_amplitude=0.7, emphasis_style="tilt", movement_smoothing=0.35,
    ),
    "classical": GenrePreset(
        name="classical", display_name="Classical",
        head_bob_amplitude=10.0, head_bob_speed=1.5,
        body_sway_amplitude=85.0, body_sway_speed=1.5,
        antenna_amplitude=0.6, emphasis_style="tilt", movement_smoothing=0.4,
    ),
    "chill": GenrePreset(
        name="chill", display_name="Chill / Ambient",
        head_bob_amplitude=10.0, head_bob_speed=1.5,
        body_sway_amplitude=75.0, body_sway_speed=1.5,
        antenna_amplitude=0.6, emphasis_style="tilt", movement_smoothing=0.45,
    ),
}

DEFAULT_GENRE = "electronic"


def get_preset(name: str) -> GenrePreset:
    return GENRE_PRESETS.get(name, GENRE_PRESETS[DEFAULT_GENRE])


def genre_choices() -> list[dict[str, str]]:
    """[{value, label}] for the UI."""
    return [{"value": name, "label": p.display_name} for name, p in GENRE_PRESETS.items()]
