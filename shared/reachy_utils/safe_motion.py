"""Safe wrappers around Reachy Mini motion calls.

Every robot command in an app runs inside a long-lived loop. A transient SDK
hiccup (USB blip, daemon restart, kinematics warning) must never crash that
loop. These wrappers swallow and log errors, returning a bool so callers can
react without try/except boilerplate at every site.
"""

from __future__ import annotations

import logging
from typing import Any, Callable

logger = logging.getLogger(__name__)


def safe_call(fn: Callable[..., Any], *args, what: str = "", **kwargs) -> bool:
    """Run a robot call, log and swallow any error. Returns success."""
    try:
        fn(*args, **kwargs)
        return True
    except Exception as e:  # noqa: BLE001 — loop resilience is the whole point
        logger.debug("robot call failed (%s): %s", what or getattr(fn, "__name__", "?"), e)
        return False


def safe_goto(robot: Any, *, what: str = "goto_target", **kwargs) -> bool:
    """robot.goto_target(**kwargs), error-swallowed."""
    return safe_call(robot.goto_target, what=what, **kwargs)


def safe_play_sound(robot: Any, sound_name: str) -> bool:
    """robot.media.play_sound(name), error-swallowed (media may be absent)."""
    try:
        robot.media.play_sound(sound_name)
        return True
    except Exception as e:  # noqa: BLE001
        logger.debug("play_sound failed (%s): %s", sound_name, e)
        return False
