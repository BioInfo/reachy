"""DJ Reactor's discrete robot reactions — the moment→move maps.

Two libraries, two jobs:
- **Emotional moments** (start vibing, music starts/pauses, set ends, exit) use
  the emotion library through the shared `EmotionFeedback` dispatcher, exactly
  like Focus Guardian. These are short reactions at transitions.
- **Drops** use the *dance* library: a big signature move that briefly takes over
  when a heavy onset hits. The continuous beat-driven groove (DanceController) is
  not feedback — it runs every frame in the control loop; feedback is only the
  punctuation around it.

Both default to the dispatch policy library-first / hand-rolled-fallback, and
both honor the `sound` gate (DJ defaults sound ON, but it's still a config flag).
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from shared.reachy_utils import (
    EmotionPlayer,
    EmotionFeedback,
    FeedbackCue,
    DANCES_DATASET,
    attention_wiggle,
    victory_dance,
    idle_breathing,
    focus_mode_enter,
    focus_mode_exit,
)

logger = logging.getLogger(__name__)

# app-level moments (not emitted by the session machine)
ENTER = "enter"
EXIT = "exit"

# drop moves, in preference order (first available in the dance library wins)
DROP_MOVES = [
    "dizzy_spin", "polyrhythm_combo", "groovy_sway_and_roll", "jackson_square",
    "interwoven_spirals", "neck_recoil", "sharp_side_tilt", "pendulum_swing",
]


def build_dj_feedback(player: Optional[EmotionPlayer] = None,
                      *, sound: bool = True) -> EmotionFeedback:
    """Emotional moment reactions over the emotion library."""
    player = player or EmotionPlayer()
    cues = {
        ENTER: FeedbackCue(
            candidates=["enthusiastic1", "cheerful1", "welcoming1"],
            fallback=focus_mode_enter, sound="wake_up.wav",
        ),
        "music_started": FeedbackCue(
            candidates=["cheerful1", "enthusiastic1", "amazed1", "welcoming1"],
            fallback=attention_wiggle, sound="cheerful1.wav",
        ),
        "music_paused": FeedbackCue(
            candidates=["inquiring1", "curious1", "confused1"],
            fallback=idle_breathing,
        ),
        "set_ended": FeedbackCue(
            candidates=["proud1", "success1", "relief1"],
            fallback=victory_dance, sound="success1.wav",
        ),
        EXIT: FeedbackCue(
            candidates=["sleep1", "relief1"],
            fallback=focus_mode_exit, sound="go_sleep.wav",
        ),
    }
    return EmotionFeedback(player, cues, sound=sound)


class DropDancer:
    """Plays a signature dance-library move on a drop, with graceful fallback."""

    def __init__(self, *, sound: bool = True):
        self.player = EmotionPlayer(DANCES_DATASET)
        self.sound = sound
        self._move: Optional[str] = None

    def resolve(self) -> Optional[str]:
        if self._move is None:
            self._move = self.player.resolve(DROP_MOVES)
        return self._move

    def play(self, robot: Any) -> str:
        """Play a drop move (blocking — it briefly takes over). Returns a label."""
        name = self.resolve()
        if name and self.player.play(robot, name, blocking=True, sound=self.sound):
            return f"drop:{name}"
        # fallback: a quick energetic wiggle so a drop is never silent visually
        try:
            attention_wiggle(robot)
        except Exception as e:  # noqa: BLE001
            logger.debug("drop fallback error: %s", e)
        return "drop:wiggle"
