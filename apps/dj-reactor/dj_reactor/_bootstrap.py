"""Make the monorepo `shared` package importable.

The daemon spawns installed apps as `python -m dj_reactor.main`/`app`, which puts
the app package on sys.path but not the repo root where `shared/` lives. This
walks up to find the dir containing `shared/__init__.py` and inserts it on
sys.path. Idempotent and silent if `shared` already imports (e.g. when vendored
into an HF Space at publish time). Same shim as Focus Guardian.
"""

from __future__ import annotations

import sys
from pathlib import Path


def ensure_shared_importable() -> None:
    try:
        import shared  # noqa: F401
        return
    except ImportError:
        pass
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared" / "__init__.py").exists():
            sys.path.insert(0, str(parent))
            return
