"""FocusConfig — every Focus Guardian tunable in one place.

Each field is overridable via env (FG_*) and is exposed to the UI via
`public_dict()` (which never leaks the VLM api key). v1 buried magic numbers in
method bodies *and* made them unoverridable; this is the fix. The app builds its
attention detector from `detector_spec()` so detection is config-driven too.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from shared.app.config import (
    BaseAppConfig, app_data_dir, env_str, env_int, env_float, env_bool,
)

APP_NAME = "focus-guardian"


@dataclass
class FocusConfig(BaseAppConfig):
    app_name: str = APP_NAME

    # session shape
    duration_minutes: int = 25
    break_minutes: int = 5            # 0 disables the post-session break
    # attention -> nudge timing
    distraction_grace_s: float = 5.0  # consecutive distracted seconds before a nudge
    nudge_cooldown_s: float = 20.0    # min seconds between nudges
    # loop / ambient
    tick_hz: float = 2.0
    breathe_interval_s: float = 6.0
    # robot expression
    sound_enabled: bool = False       # emotion clips ship loud .wavs — opt-in
    # camera + detector
    camera_enabled: bool = True
    detector_kind: str = "auto"       # auto | motion | vlm
    # motion detector
    motion_roi_left: float = 0.0
    motion_roi_right: float = 0.4     # user sits in left 40%, monitors ignored
    motion_threshold: float = 0.003
    motion_smoothing_window: int = 10
    motion_still_grace_frames: int = 20
    # vlm detector (unset base_url/model -> disabled, app stays HF-publishable)
    vlm_base_url: str = ""
    vlm_api_key: str = ""
    vlm_model: str = ""
    vlm_interval_s: float = 8.0
    # server
    ui_port: int = 7862

    @classmethod
    def from_env(cls) -> "FocusConfig":
        return cls(
            duration_minutes=env_int("FG_DURATION_MIN", 25),
            break_minutes=env_int("FG_BREAK_MIN", 5),
            distraction_grace_s=env_float("FG_DISTRACTION_GRACE_S", 5.0),
            nudge_cooldown_s=env_float("FG_NUDGE_COOLDOWN_S", 20.0),
            tick_hz=env_float("FG_TICK_HZ", 2.0),
            breathe_interval_s=env_float("FG_BREATHE_INTERVAL_S", 6.0),
            sound_enabled=env_bool("FG_SOUND_ENABLED", False),
            camera_enabled=env_bool("FG_CAMERA_ENABLED", True),
            detector_kind=env_str("FG_DETECTOR_KIND", "auto"),
            motion_roi_left=env_float("FG_MOTION_ROI_LEFT", 0.0),
            motion_roi_right=env_float("FG_MOTION_ROI_RIGHT", 0.4),
            motion_threshold=env_float("FG_MOTION_THRESHOLD", 0.003),
            motion_smoothing_window=env_int("FG_MOTION_SMOOTHING", 10),
            motion_still_grace_frames=env_int("FG_MOTION_STILL_GRACE", 20),
            vlm_base_url=env_str("FG_VLM_BASE_URL", ""),
            vlm_api_key=env_str("FG_VLM_API_KEY", ""),
            vlm_model=env_str("FG_VLM_MODEL", ""),
            vlm_interval_s=env_float("FG_VLM_INTERVAL_S", 8.0),
            ui_port=env_int("FG_UI_PORT", 7862),
        )

    # -- derived -----------------------------------------------------------

    @property
    def tick_interval_s(self) -> float:
        return 1.0 / self.tick_hz if self.tick_hz > 0 else 0.5

    @property
    def history_path(self) -> Path:
        return app_data_dir(self.app_name) / "history.jsonl"

    def detector_spec(self) -> dict[str, Any]:
        return {
            "kind": self.detector_kind,
            "motion": {
                "roi_left": self.motion_roi_left,
                "roi_right": self.motion_roi_right,
                "motion_threshold": self.motion_threshold,
                "smoothing_window": self.motion_smoothing_window,
                "still_grace_frames": self.motion_still_grace_frames,
            },
            "vlm": {
                "base_url": self.vlm_base_url,
                "api_key": self.vlm_api_key,
                "model": self.vlm_model,
                "min_interval_s": self.vlm_interval_s,
            },
        }

    def public_dict(self) -> dict[str, Any]:
        """Config for the UI / WebSocket — secrets stripped."""
        return {
            "duration_minutes": self.duration_minutes,
            "break_minutes": self.break_minutes,
            "distraction_grace_s": self.distraction_grace_s,
            "nudge_cooldown_s": self.nudge_cooldown_s,
            "sound_enabled": self.sound_enabled,
            "camera_enabled": self.camera_enabled,
            "detector_kind": self.detector_kind,
            "vlm_enabled": bool(self.vlm_base_url and self.vlm_model),
        }

    def apply_overrides(self, **kwargs: Any) -> None:
        """Apply UI-driven overrides (only known, safe fields)."""
        allowed = {
            "duration_minutes", "break_minutes", "distraction_grace_s",
            "nudge_cooldown_s", "camera_enabled", "detector_kind", "sound_enabled",
        }
        for k, v in kwargs.items():
            if k in allowed and v is not None:
                setattr(self, k, v)
