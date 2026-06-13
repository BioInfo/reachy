"""DJ Reactor — music visualizer / dance companion for Reachy Mini.

v2 rebuild on the shared app layer (audio/, reachy_utils/, app/, ui/). `_bootstrap`
puts the monorepo `shared/` on the path so config/dance/session/feedback resolve
when run as an installed app.
"""

from ._bootstrap import ensure_shared_importable

ensure_shared_importable()

__version__ = "2.0.0"

# v1 orchestrator kept importable as a fallback until v2 drives the robot.
try:
    from .main import ReachyMiniDjReactor  # noqa: F401
    __all__ = ["ReachyMiniDjReactor"]
except Exception:  # noqa: BLE001 — v1 deps (gradio) optional during the v2 build
    __all__ = []
