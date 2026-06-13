"""Reusable app-level building blocks shared across Reachy Mini apps.

- config: env parsing helpers + per-app data dir (`BaseAppConfig`).
- persistence: append-only `SessionStore` with daily rollups.
- server (added in the UI step): FastAPI + WebSocket app scaffold.
"""

from .config import (
    BaseAppConfig,
    app_data_dir,
    env_str,
    env_int,
    env_float,
    env_bool,
)
from .persistence import SessionStore

__all__ = [
    "BaseAppConfig",
    "app_data_dir",
    "env_str",
    "env_int",
    "env_float",
    "env_bool",
    "SessionStore",
]
