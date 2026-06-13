"""DJConfig — every DJ Reactor tunable in one place.

Each field is overridable via env (DJ_*) and exposed to the UI via
`public_dict()`. v1 buried movement and audio constants in method bodies; this is
the fix, matching the Focus Guardian v2 pattern. The app builds its audio source
from `audio_spec()` so capture is config-driven too.

DJ is a music app, so sound defaults ON — but it's a config default
(`DJ_SOUND_ENABLED`), never hardcoded, so it can be silenced for a quiet room.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from shared.app.config import (
    BaseAppConfig, app_data_dir, env_str, env_int, env_float, env_bool,
)

from .genres import DEFAULT_GENRE, get_preset

APP_NAME = "dj-reactor"


@dataclass
class DJConfig(BaseAppConfig):
    app_name: str = APP_NAME

    # dance shaping
    genre: str = DEFAULT_GENRE
    intensity: float = 0.7        # 0.1..1.0 how dramatic the motion is
    react_to_drops: bool = True   # play a dance-library move on a big drop

    # audio
    audio_kind: str = "auto"      # auto | mic | silent
    audio_device_index: int = -1  # -1 = system default input
    sample_rate: int = 44100
    chunk_size: int = 2048
    sensitivity: float = 0.6      # 0.2..1.0 beat-detection sensitivity

    # expression
    sound_enabled: bool = True    # DJ is a music app -> default ON (still a default)

    # loop / motion
    tick_hz: float = 10.0         # movement update rate (~v1 0.1s)
    move_duration_s: float = 0.12 # goto_target duration per command
    silence_pause_s: float = 2.0  # sustained silence before "music paused"
    drop_onset_threshold: float = 1.7  # onset strength that counts as a drop
    drop_cooldown_s: float = 6.0  # min seconds between drop reactions

    # server
    ui_port: int = 7861

    @classmethod
    def from_env(cls) -> "DJConfig":
        return cls(
            genre=env_str("DJ_GENRE", DEFAULT_GENRE),
            intensity=env_float("DJ_INTENSITY", 0.7),
            react_to_drops=env_bool("DJ_REACT_TO_DROPS", True),
            audio_kind=env_str("DJ_AUDIO_KIND", "auto"),
            audio_device_index=env_int("DJ_AUDIO_DEVICE", -1),
            sample_rate=env_int("DJ_SAMPLE_RATE", 44100),
            chunk_size=env_int("DJ_CHUNK_SIZE", 2048),
            sensitivity=env_float("DJ_SENSITIVITY", 0.6),
            sound_enabled=env_bool("DJ_SOUND_ENABLED", True),
            tick_hz=env_float("DJ_TICK_HZ", 10.0),
            move_duration_s=env_float("DJ_MOVE_DURATION_S", 0.12),
            silence_pause_s=env_float("DJ_SILENCE_PAUSE_S", 2.0),
            drop_onset_threshold=env_float("DJ_DROP_ONSET", 1.7),
            drop_cooldown_s=env_float("DJ_DROP_COOLDOWN_S", 6.0),
            ui_port=env_int("DJ_UI_PORT", 7861),
        )

    # -- derived -----------------------------------------------------------

    @property
    def tick_interval_s(self) -> float:
        return 1.0 / self.tick_hz if self.tick_hz > 0 else 0.1

    @property
    def device_index(self) -> Optional[int]:
        return None if self.audio_device_index < 0 else self.audio_device_index

    @property
    def history_path(self) -> Path:
        return app_data_dir(self.app_name) / "history.jsonl"

    def preset(self):  # noqa: ANN201 — GenrePreset
        return get_preset(self.genre)

    def audio_spec(self) -> dict[str, Any]:
        return {
            "kind": self.audio_kind,
            "mic": {
                "device_index": self.device_index,
                "sample_rate": self.sample_rate,
                "chunk_size": self.chunk_size,
                "sensitivity": self.sensitivity,
            },
        }

    def public_dict(self) -> dict[str, Any]:
        return {
            "genre": self.genre,
            "intensity": self.intensity,
            "sensitivity": self.sensitivity,
            "sound_enabled": self.sound_enabled,
            "react_to_drops": self.react_to_drops,
        }

    def apply_overrides(self, **kwargs: Any) -> None:
        """Apply UI-driven overrides (only known, safe fields)."""
        allowed = {
            "genre", "intensity", "sensitivity", "sound_enabled",
            "react_to_drops", "audio_device_index",
        }
        for k, v in kwargs.items():
            if k in allowed and v is not None:
                if k == "genre" and not isinstance(v, str):
                    continue
                setattr(self, k, v)
        # clamp the numerics
        self.intensity = max(0.1, min(1.0, float(self.intensity)))
        self.sensitivity = max(0.2, min(1.0, float(self.sensitivity)))
