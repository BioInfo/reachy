"""Semantic-event -> robot reaction dispatcher (reusable across apps).

An app names *events* ("nudge", "celebrate", "enter") and maps each to a
`FeedbackCue`: an ordered list of emotion-library moves to try, plus a
hand-rolled fallback animation if none are available. This dispatcher does the
"library first, fallback second" logic once so every app's feedback layer is
just a data map.

The app owns the map (it knows its events); this owns the playback policy.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from .emotions import EmotionPlayer
from .safe_motion import safe_call, safe_play_sound

logger = logging.getLogger(__name__)

FallbackFn = Callable[[Any], None]  # fn(robot) -> None


@dataclass
class FeedbackCue:
    candidates: list[str] = field(default_factory=list)  # emotion moves, first-available wins
    fallback: Optional[FallbackFn] = None                # hand-rolled animation if no move plays
    sound: Optional[str] = None                          # sound for the fallback path


class EmotionFeedback:
    def __init__(self, player: EmotionPlayer, cues: dict[str, FeedbackCue],
                 *, sound: bool = False):
        self.player = player
        self.cues = cues
        self.sound = sound  # off by default — emotion clips ship loud .wavs

    def play(self, robot: Any, event: str, *, blocking: bool = True) -> str:
        """Play the reaction for `event`. Returns a label of what ran.

        Tries the emotion library first; on miss, runs the fallback animation.
        Sound is gated by `self.sound` (off by default): motion always, audio
        only when enabled. Returns "emotion:<name>", "fallback:<event>", or
        "noop:<event>" for UI/telemetry.
        """
        cue = self.cues.get(event)
        if cue is None:
            logger.debug("no feedback cue for event %r", event)
            return f"noop:{event}"

        if cue.candidates:
            name = self.player.resolve(cue.candidates)
            if name and self.player.play(robot, name, blocking=blocking, sound=self.sound):
                return f"emotion:{name}"

        if cue.fallback is not None:
            if cue.sound and self.sound:
                safe_play_sound(robot, cue.sound)
            safe_call(cue.fallback, robot, what=f"fallback:{event}")
            return f"fallback:{event}"

        return f"noop:{event}"
