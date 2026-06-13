"""Focus Guardian's robot reactions — the event→emotion map.

The dispatch policy (library-first, fallback animation) lives in shared
`EmotionFeedback`; this only declares *which* emotion fits *which* moment. Keyed
by `SessionEvent` values plus the app-level moments "enter" / "exit" / "breathe"
so the orchestrator can call `feedback.play(robot, event)` uniformly.

Each cue lists ordered emotion candidates (first available wins) and a
hand-rolled fallback from shared.reachy_utils.animations for when the emotion
library or robot playback isn't there.
"""

from __future__ import annotations

from shared.reachy_utils import (
    EmotionPlayer,
    EmotionFeedback,
    FeedbackCue,
    attention_wiggle,
    disappointed_shake,
    victory_dance,
    idle_breathing,
    focus_mode_enter,
    focus_mode_exit,
)


# app-level moments not emitted by the session machine
ENTER = "enter"
EXIT = "exit"
BREATHE = "breathe"


def build_focus_feedback(player: EmotionPlayer | None = None,
                         *, sound: bool = False) -> EmotionFeedback:
    player = player or EmotionPlayer()
    cues = {
        ENTER: FeedbackCue(
            candidates=["attentive1", "welcoming1", "curious1"],
            fallback=focus_mode_enter, sound="wake_up.wav",
        ),
        "nudge": FeedbackCue(
            candidates=["impatient1", "inquiring1", "attentive1"],
            fallback=attention_wiggle, sound="impatient1.wav",
        ),
        "escalate": FeedbackCue(
            candidates=["displeased1", "reprimand1", "irritated1"],
            fallback=disappointed_shake, sound="confused1.wav",
        ),
        "completed": FeedbackCue(
            candidates=["success1", "proud1", "cheerful1"],
            fallback=victory_dance, sound="dance1.wav",
        ),
        "break_started": FeedbackCue(
            candidates=["calming1", "serenity1", "relief1"],
            fallback=focus_mode_exit,
        ),
        "break_ended": FeedbackCue(
            candidates=["attentive1", "welcoming1"],
            fallback=focus_mode_enter,
        ),
        EXIT: FeedbackCue(
            candidates=["sleep1", "relief1"],
            fallback=focus_mode_exit, sound="go_sleep.wav",
        ),
        BREATHE: FeedbackCue(
            candidates=[],  # ambient — never interrupt with an emotion clip
            fallback=idle_breathing,
        ),
    }
    return EmotionFeedback(player, cues, sound=sound)
