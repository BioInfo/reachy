"""Focus Guardian — productivity body-double for Reachy Mini.

v2 rebuild in progress. `_bootstrap` puts the monorepo `shared/` on the path so
config/session/detection/feedback resolve when run as an installed app.
"""

from ._bootstrap import ensure_shared_importable

ensure_shared_importable()

__version__ = "2.0.0-dev"

# v1 orchestrator kept importable as a fallback until v2 drives the robot.
try:
    from .main import ReachyMiniFocusGuardian  # noqa: F401
    __all__ = ["ReachyMiniFocusGuardian"]
except Exception:  # noqa: BLE001 — v1 deps optional during the v2 build
    __all__ = []
