"""Reachy Mini motion utilities shared across apps (SDK 1.8.1).

- `EmotionPlayer` — play named moves from the Pollen emotion/dance libraries.
- `safe_goto` / `safe_call` / `safe_play_sound` — loop-resilient robot calls.
- hand-rolled fallback animations (used when the emotion library is absent).
"""

from .emotions import EmotionPlayer, EMOTIONS_DATASET, DANCES_DATASET
from .safe_motion import safe_call, safe_goto, safe_play_sound
from .feedback import EmotionFeedback, FeedbackCue
from .animations import (
    victory_dance,
    disappointed_shake,
    attention_wiggle,
    idle_breathing,
    focus_mode_enter,
    focus_mode_exit,
)

__all__ = [
    "EmotionPlayer",
    "EMOTIONS_DATASET",
    "DANCES_DATASET",
    "safe_call",
    "safe_goto",
    "safe_play_sound",
    "EmotionFeedback",
    "FeedbackCue",
    "victory_dance",
    "disappointed_shake",
    "attention_wiggle",
    "idle_breathing",
    "focus_mode_enter",
    "focus_mode_exit",
]
