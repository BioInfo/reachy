"""Reachy's robot reactions — the voice-event → emotion map.

The dispatch policy (library-first, hand-rolled fallback) lives in shared
`EmotionFeedback`; this only declares *which* gentle emotion fits *which* beat of
a spoken turn. Keyed by app-level feedback events that `app.py` derives from the
VoiceLoop's state ("wake", "listening", "thinking", "settle", "error") plus the
lifecycle moments "enter" / "exit" / "breathe".

Deliberately calm. Reachy sits on a desk and talks with you; it should feel present,
not perform. Antennas are the self-collision risk (the DJ Reactor lesson), so every
cue prefers a small, settled emotion-library move and a tiny hand-rolled fallback.
Crucially, NO cue runs while Reachy is *speaking* — the speaker owns that beat, and we
don't want a move competing with audio over the same media link. Motion happens
around speech (waking, listening, thinking, settling), not during it.
"""

from __future__ import annotations

from shared.reachy_utils import (
    EmotionPlayer,
    EmotionFeedback,
    FeedbackCue,
    attention_wiggle,
    idle_breathing,
    focus_mode_enter,
    focus_mode_exit,
)

# app-level lifecycle moments
ENTER = "enter"
EXIT = "exit"
BREATHE = "breathe"


def build_reachy_feedback(player: EmotionPlayer | None = None,
                        *, sound: bool = False) -> EmotionFeedback:
    player = player or EmotionPlayer()
    cues = {
        ENTER: FeedbackCue(
            candidates=["welcoming1", "attentive1", "curious1"],
            fallback=focus_mode_enter,
        ),
        "wake": FeedbackCue(
            candidates=["curious1", "attentive1", "inquiring1"],
            fallback=attention_wiggle,
        ),
        "listening": FeedbackCue(
            candidates=["inquiring1", "inquiring2", "attentive2"],
            fallback=attention_wiggle,
        ),
        "thinking": FeedbackCue(
            candidates=["curious1", "calming1", "inquiring3"],
            fallback=idle_breathing,
        ),
        "settle": FeedbackCue(
            candidates=["relief1", "attentive1", "welcoming1"],
            fallback=idle_breathing,
        ),
        "error": FeedbackCue(
            candidates=["confused1"],
            fallback=attention_wiggle,
        ),
        EXIT: FeedbackCue(
            candidates=["sleep1", "relief1"],
            fallback=focus_mode_exit,
        ),
        BREATHE: FeedbackCue(
            candidates=[],  # ambient — never interrupt with an emotion clip
            fallback=idle_breathing,
        ),
    }
    return EmotionFeedback(player, cues, sound=sound)
