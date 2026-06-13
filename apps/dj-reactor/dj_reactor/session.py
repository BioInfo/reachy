"""DJ set state machine — pure logic, no robot, no wall clock.

A "set" runs from when the user hits start to when they stop. Within it, music
comes and goes: `tick(delta, features)` advances the set and returns the discrete
moments the app reacts to — music started, music paused (sustained silence), a
drop hit, the set ended. The continuous beat-driven dancing is NOT a session
event; the `DanceController` produces that every frame. The session only emits
the punctuation.

Delta-driven and side-effect-free, so it's unit-testable: feed a sequence of
(delta, features) and assert on the events, no monkeypatching time. Mirrors the
Focus Guardian `FocusSession` shape.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from shared.audio import AudioFeatures


class DJState(str, Enum):
    IDLE = "idle"            # not started
    LISTENING = "listening"  # started, waiting for / between music
    VIBING = "vibing"        # music playing, robot dancing


class DJEvent(str, Enum):
    MUSIC_STARTED = "music_started"  # silence -> sound
    MUSIC_PAUSED = "music_paused"    # sound -> sustained silence
    DROP = "drop"                    # a big onset while vibing
    SET_ENDED = "set_ended"          # user stopped the set


@dataclass
class DJStats:
    elapsed_s: float = 0.0   # wall time since start
    vibing_s: float = 0.0    # time music was actually playing
    beats: int = 0
    peak_bpm: float = 0.0
    drops: int = 0


class DJSession:
    def __init__(self, *, silence_pause_s: float = 2.0,
                 drop_onset_threshold: float = 1.7, drop_cooldown_s: float = 6.0):
        self.silence_pause_s = silence_pause_s
        self.drop_onset_threshold = drop_onset_threshold
        self.drop_cooldown_s = drop_cooldown_s
        self.reset()

    def reset(self) -> None:
        self.state = DJState.IDLE
        self.elapsed_s = 0.0
        self.vibing_s = 0.0
        self.beats = 0
        self.drops = 0
        self.peak_bpm = 0.0
        self.current_bpm = 0.0
        self._silence_run_s = 0.0
        self._since_drop_s = self.drop_cooldown_s

    def start(self) -> None:
        self.reset()
        self.state = DJState.LISTENING

    @property
    def active(self) -> bool:
        return self.state in (DJState.LISTENING, DJState.VIBING)

    @property
    def vibing(self) -> bool:
        return self.state == DJState.VIBING

    def stats(self) -> DJStats:
        return DJStats(
            elapsed_s=self.elapsed_s, vibing_s=self.vibing_s,
            beats=self.beats, peak_bpm=self.peak_bpm, drops=self.drops,
        )

    # -- advance -----------------------------------------------------------

    def tick(self, delta: float, f: AudioFeatures) -> list[DJEvent]:
        if delta <= 0 or not self.active:
            return []

        events: list[DJEvent] = []
        self.elapsed_s += delta
        self._since_drop_s += delta

        if f.is_silent:
            self._silence_run_s += delta
            if self.state == DJState.VIBING and self._silence_run_s >= self.silence_pause_s:
                self.state = DJState.LISTENING
                events.append(DJEvent.MUSIC_PAUSED)
            return events

        # sound present
        self._silence_run_s = 0.0
        if self.state == DJState.LISTENING:
            self.state = DJState.VIBING
            events.append(DJEvent.MUSIC_STARTED)

        # vibing accounting
        self.vibing_s += delta
        self.current_bpm = f.bpm
        if f.bpm > self.peak_bpm:
            self.peak_bpm = f.bpm
        if f.beat_detected:
            self.beats += 1

        # drop detection (cooldown-gated)
        if (f.onset_strength >= self.drop_onset_threshold
                and self._since_drop_s >= self.drop_cooldown_s):
            self._since_drop_s = 0.0
            self.drops += 1
            events.append(DJEvent.DROP)

        return events

    def stop(self) -> list[DJEvent]:
        if self.state == DJState.IDLE:
            return []
        self.state = DJState.IDLE
        return [DJEvent.SET_ENDED]
