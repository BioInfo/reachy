"""Thin wrapper over the Pollen emotion / dance move libraries.

SDK 1.8.1 ships `RecordedMoves`, which loads a HuggingFace dataset of recorded
trajectories (`pollen-robotics/reachy-mini-emotions-library`, 81 named moves
like ``impatient1``, ``success1``, ``calming1``) the daemon pre-caches at
startup. This wraps the load + playback so an app can say "play a gentle nudge"
without touching dataset internals, and degrades cleanly (returns False) when
the library or robot playback isn't available — the app then falls back to
hand-rolled goto_target animations.

Loading is lazy and cached per dataset; the first `.play()` (or an explicit
`.preload()`) pays the cost, subsequent calls are instant.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Iterable, Optional

logger = logging.getLogger(__name__)

EMOTIONS_DATASET = "pollen-robotics/reachy-mini-emotions-library"
DANCES_DATASET = "pollen-robotics/reachy-mini-dances-library"


class EmotionPlayer:
    """Load a recorded-move library and play moves on a robot by name."""

    def __init__(self, dataset: str = EMOTIONS_DATASET, *, offline_first: bool = True):
        self.dataset = dataset
        self._offline_first = offline_first
        self._lib: Any = None
        self._names: list[str] = []
        self._load_failed = False

    # -- loading -----------------------------------------------------------

    def preload(self) -> bool:
        """Load the library from local cache (or network). Returns availability."""
        if self._lib is not None:
            return True
        if self._load_failed:
            return False
        try:
            # Prefer the daemon-prewarmed local cache; avoid a blocking download
            # in the hot path. Fall back to network only if explicitly allowed.
            if self._offline_first:
                os.environ.setdefault("HF_HUB_OFFLINE", "0")  # let SDK decide; it tries local first
            from reachy_mini.motion.recorded_move import RecordedMoves

            self._lib = RecordedMoves(self.dataset)
            self._names = list(self._lib.list_moves())
            logger.info("emotion library loaded: %d moves from %s", len(self._names), self.dataset)
            return True
        except Exception as e:  # noqa: BLE001
            logger.warning("emotion library unavailable (%s): %s", self.dataset, e)
            self._load_failed = True
            return False

    @property
    def available(self) -> bool:
        return self.preload()

    def list_moves(self) -> list[str]:
        self.preload()
        return list(self._names)

    def has(self, name: str) -> bool:
        self.preload()
        return name in self._names

    def resolve(self, candidates: Iterable[str]) -> Optional[str]:
        """Return the first candidate move that exists in the library, else None."""
        self.preload()
        for name in candidates:
            if name in self._names:
                return name
        return None

    # -- playback ----------------------------------------------------------

    def play(
        self,
        robot: Any,
        name: str,
        *,
        blocking: bool = True,
        sound: bool = True,
        initial_goto_duration: float = 0.3,
    ) -> bool:
        """Play a named recorded move on the robot. Returns success.

        blocking=False uses async_play_move so the control loop keeps ticking.
        Any failure (move missing, no robot playback API) returns False so the
        caller can fall back to a hand-rolled animation.
        """
        if not self.preload():
            return False
        if name not in self._names:
            logger.debug("emotion move not found: %s", name)
            return False
        try:
            move = self._lib.get(name)
            fn = robot.play_move if blocking else robot.async_play_move
            fn(move, sound=sound, initial_goto_duration=initial_goto_duration)
            return True
        except Exception as e:  # noqa: BLE001
            logger.debug("emotion playback failed (%s): %s", name, e)
            return False

    def play_first(
        self,
        robot: Any,
        candidates: Iterable[str],
        *,
        blocking: bool = True,
        sound: bool = True,
    ) -> bool:
        """Play the first candidate that exists. Returns success."""
        name = self.resolve(candidates)
        if name is None:
            return False
        return self.play(robot, name, blocking=blocking, sound=sound)
