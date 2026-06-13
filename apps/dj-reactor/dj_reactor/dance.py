"""Audio -> motion mapping. Pure logic, no robot, fully testable.

`DanceController.compute(features, dt)` turns one `AudioFeatures` frame into a
bounded `Movement` (head bob/roll/pitch, body yaw, two antennas). Bass drives the
body sway, mids drive the head, treble drives the antennas, and a detected beat
punches an emphasis whose style comes from the genre preset. Output is smoothed
frame-to-frame and clamped to safe ranges so the control loop can hand it
straight to `goto_target`.

Ported from DJ Reactor v1's `DanceController`, with the wall-clock tilt timer
replaced by an accumulated `dt` so the same input sequence always yields the same
output (unit-testable).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from shared.audio import AudioFeatures

from .genres import GenrePreset

# Safe motion envelopes (degrees / mm / unit antenna). Deliberately conservative:
# v1's wide limits let the head roll + antennas swing far enough to hit the robot's
# own face. These keep the groove expressive but self-collision-safe.
HEAD_Z_MAX = 14.0
HEAD_ROLL_MAX = 20.0
HEAD_PITCH_MAX = 20.0
BODY_YAW_MAX = 35.0
ANTENNA_MAX = 0.55


@dataclass
class Movement:
    head_z: float = 0.0        # mm, vertical bob
    head_roll: float = 0.0     # deg, side tilt
    head_pitch: float = 0.0    # deg, beat-triggered nod/headbang
    body_yaw: float = 0.0      # deg, sweep
    antenna_left: float = 0.0  # -1..1
    antenna_right: float = 0.0 # -1..1

    def as_dict(self) -> dict[str, float]:
        return {
            "head_z": round(self.head_z, 2),
            "head_roll": round(self.head_roll, 2),
            "head_pitch": round(self.head_pitch, 2),
            "body_yaw": round(self.body_yaw, 2),
            "antenna_left": round(self.antenna_left, 3),
            "antenna_right": round(self.antenna_right, 3),
        }


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


class DanceController:
    def __init__(self, preset: GenrePreset, intensity: float = 0.7):
        self.preset = preset
        self.intensity = max(0.1, min(1.0, intensity))
        self.dance_time = 0.0
        # smoothing state
        self._s_head_z = 0.0
        self._s_head_roll = 0.0
        self._s_body_yaw = 0.0
        self._s_ant_l = 0.0
        self._s_ant_r = 0.0

    def update_preset(self, preset: GenrePreset) -> None:
        self.preset = preset

    def update_intensity(self, intensity: float) -> None:
        self.intensity = max(0.1, min(1.0, intensity))

    def reset(self) -> None:
        self.dance_time = 0.0
        self._s_head_z = self._s_head_roll = self._s_body_yaw = 0.0
        self._s_ant_l = self._s_ant_r = 0.0

    def compute(self, f: AudioFeatures, dt: float = 0.1) -> Movement:
        self.dance_time += dt
        p = self.preset
        phase = f.beat_phase * 2 * math.pi

        # groove scales with the music: gentle when quiet, bigger when loud.
        # v1 pinned a 0.8 floor so it always slammed near max — that's the "crazy".
        energy = (0.35 + 0.45 * f.rms) * self.intensity

        # body sway — big sweep, bass-boosted
        bass_boost = 0.8 + 0.5 * f.bass
        body_target = p.body_sway_amplitude * energy * bass_boost * math.sin(phase * p.body_sway_speed)

        # head — bob (z) and roll, mid-boosted
        mid_boost = 0.7 + 0.6 * f.mid
        head_z_target = p.head_bob_amplitude * energy * 1.2 * math.sin(phase * p.head_bob_speed)
        head_roll_target = p.head_bob_amplitude * 2.0 * energy * mid_boost * math.sin(phase * 0.5)

        # beat emphasis — punch the beat per genre style (softened so a hard onset
        # can't whip the head into itself; the clamp is the final guard)
        head_pitch = 0.0
        if f.beat_detected:
            strength = max(f.onset_strength, 1.2) * self.intensity
            if p.emphasis_style == "headbang":
                head_pitch = -16.0 * strength
            elif p.emphasis_style == "nod":
                head_pitch = -12.0 * strength
            elif p.emphasis_style == "tilt":
                head_roll_target += 14.0 * strength * (1 if self.dance_time % 2 > 1 else -1)

        # antennas — bouncy, treble-boosted, counter-phased. Lower multiplier +
        # tighter clamp keep them off the robot's face.
        treble_boost = 0.6 + 0.6 * f.treble
        ant_amp = p.antenna_amplitude * energy * treble_boost
        ant_l_target = ant_amp * math.sin(phase * 2)
        ant_r_target = ant_amp * math.sin(phase * 2 + math.pi)

        # exponential smoothing on the continuous channels
        s = p.movement_smoothing
        self._s_head_z = s * self._s_head_z + (1 - s) * head_z_target
        self._s_head_roll = s * self._s_head_roll + (1 - s) * head_roll_target
        self._s_body_yaw = s * self._s_body_yaw + (1 - s) * body_target
        self._s_ant_l = s * self._s_ant_l + (1 - s) * ant_l_target
        self._s_ant_r = s * self._s_ant_r + (1 - s) * ant_r_target

        return Movement(
            head_z=_clamp(self._s_head_z, -HEAD_Z_MAX, HEAD_Z_MAX),
            head_roll=_clamp(self._s_head_roll, -HEAD_ROLL_MAX, HEAD_ROLL_MAX),
            head_pitch=_clamp(head_pitch, -HEAD_PITCH_MAX, HEAD_PITCH_MAX),
            body_yaw=_clamp(self._s_body_yaw, -BODY_YAW_MAX, BODY_YAW_MAX),
            antenna_left=_clamp(self._s_ant_l, -ANTENNA_MAX, ANTENNA_MAX),
            antenna_right=_clamp(self._s_ant_r, -ANTENNA_MAX, ANTENNA_MAX),
        )
