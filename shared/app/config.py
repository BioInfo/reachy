"""Base config helpers shared by all apps.

Each app defines its own dataclass of tunables; this gives them consistent env
parsing and a standard per-app data directory. The rule (from the v2 rebuild):
*every* tunable is overridable via env and never a magic number hardcoded in
logic. Apps subclass `BaseAppConfig` and add fields, loading them with the
`env_*` helpers in a `from_env` classmethod.
"""

from __future__ import annotations

import os
from pathlib import Path


def env_str(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


def env_int(key: str, default: int) -> int:
    try:
        return int(os.environ[key])
    except (KeyError, ValueError):
        return default


def env_float(key: str, default: float) -> float:
    try:
        return float(os.environ[key])
    except (KeyError, ValueError):
        return default


def env_bool(key: str, default: bool = False) -> bool:
    val = os.environ.get(key)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def app_data_dir(app_name: str) -> Path:
    """Per-app writable data dir.

    Override the root with REACHY_APP_DATA_DIR; defaults to
    ~/.local/share/reachy/<app_name>. Created on demand.
    """
    root = os.environ.get("REACHY_APP_DATA_DIR")
    base = Path(root) if root else Path.home() / ".local" / "share" / "reachy"
    path = base / app_name
    path.mkdir(parents=True, exist_ok=True)
    return path


class BaseAppConfig:
    """Marker base for app configs. Subclasses are dataclasses with a from_env."""

    app_name: str = "app"

    @property
    def data_dir(self) -> Path:
        return app_data_dir(self.app_name)
