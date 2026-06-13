"""FFT beat / band analyzer — the pure signal core.

`process(samples, t)` turns a mono float buffer into `AudioFeatures`: three
frequency bands, RMS loudness, an energy-onset beat detector with BPM tracking,
and a beat phase. No audio device and no threads live here, so it's fully
unit-testable — feed it synthetic sine bursts and assert on the features.

Ported from DJ Reactor v1's `AudioAnalyzer`, but split from capture so the math
can be tested in isolation and reused by any source. State (energy history, beat
times, BPM) is kept on the instance; `reset()` clears it for a new set.
"""

from __future__ import annotations

from collections import deque

import numpy as np

from .base import AudioFeatures

# Hz ranges for the three reactive bands.
BASS_RANGE = (20.0, 250.0)
MID_RANGE = (250.0, 2000.0)
TREBLE_RANGE = (2000.0, 12000.0)


class FFTBeatAnalyzer:
    def __init__(
        self,
        *,
        sample_rate: int = 44100,
        chunk_size: int = 2048,
        sensitivity: float = 0.6,
        silence_rms: float = 0.001,
        source_name: str = "analyzer",
    ):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.sensitivity = float(np.clip(sensitivity, 0.2, 1.0))
        self.silence_rms = silence_rms
        self.source_name = source_name

        freqs = np.fft.rfftfreq(chunk_size, 1.0 / sample_rate)
        self.bass_bins = np.where((freqs >= BASS_RANGE[0]) & (freqs <= BASS_RANGE[1]))[0]
        self.mid_bins = np.where((freqs >= MID_RANGE[0]) & (freqs <= MID_RANGE[1]))[0]
        self.treble_bins = np.where((freqs >= TREBLE_RANGE[0]) & (freqs <= TREBLE_RANGE[1]))[0]
        self._window = np.hanning(chunk_size)

        self.reset()

    def reset(self) -> None:
        self.energy_history: deque[float] = deque(maxlen=10)
        self.beat_times: deque[float] = deque(maxlen=50)
        self.last_beat_time = -10.0
        self.estimated_bpm = 120.0
        self.beat_interval = 0.5  # 60/120
        self.latest = AudioFeatures(source=self.source_name)

    def set_sensitivity(self, value: float) -> None:
        self.sensitivity = float(np.clip(value, 0.2, 1.0))

    # -- core --------------------------------------------------------------

    def process(self, samples: np.ndarray, t: float) -> AudioFeatures:
        """Analyze one buffer captured at time `t` (seconds). Returns features."""
        audio = np.asarray(samples, dtype=np.float64)
        if audio.ndim > 1:  # stereo -> mono
            audio = audio.mean(axis=1)
        audio = audio.flatten()

        rms = float(np.sqrt(np.mean(audio ** 2))) if audio.size else 0.0
        is_silent = rms < self.silence_rms

        bands = self._bands(audio)

        beat_detected, onset_strength = self._detect_beat(rms, t)

        time_since_beat = max(0.0, t - self.last_beat_time)
        beat_phase = (time_since_beat / self.beat_interval) % 1.0 if self.beat_interval > 0 else 0.0

        self.latest = AudioFeatures(
            bass=bands[0],
            mid=bands[1],
            treble=bands[2],
            rms=min(rms * 10.0, 1.0),
            beat_detected=beat_detected,
            onset_strength=onset_strength,
            bpm=self.estimated_bpm,
            beat_phase=beat_phase,
            is_silent=is_silent,
            source=self.source_name,
        )
        return self.latest

    def _bands(self, audio: np.ndarray) -> tuple[float, float, float]:
        if audio.size == 0:
            return (0.0, 0.0, 0.0)
        windowed = audio[: self.chunk_size]
        if windowed.size < self.chunk_size:
            windowed = np.pad(windowed, (0, self.chunk_size - windowed.size))
        windowed = windowed * self._window
        spectrum = np.abs(np.fft.rfft(windowed))

        def band(bins: np.ndarray, denom: float) -> float:
            if bins.size == 0:
                return 0.0
            return float(min(np.mean(spectrum[bins]) / denom, 1.0))

        # denominators tuned for loopback levels (v1), bass loudest -> largest
        return (band(self.bass_bins, 3.0), band(self.mid_bins, 2.0), band(self.treble_bins, 1.0))

    def _detect_beat(self, rms: float, t: float) -> tuple[bool, float]:
        self.energy_history.append(rms)
        if len(self.energy_history) < 3:
            return (False, 0.0)

        avg_energy = float(np.mean(list(self.energy_history)[:-1]))
        onset = rms / (avg_energy + 1e-10)
        # higher sensitivity -> lower threshold and shorter refractory window
        onset_threshold = 1.1 + (1.0 - self.sensitivity) * 0.5
        min_interval = 0.2 + (1.0 - self.sensitivity) * 0.2
        onset_strength = float(min(onset / onset_threshold, 2.0))

        beat = (
            onset > onset_threshold
            and (t - self.last_beat_time) > min_interval
            and rms > 0.002
        )
        if beat:
            self.beat_times.append(t)
            self.last_beat_time = t
            self._update_bpm()
        return (beat, onset_strength)

    def _update_bpm(self) -> None:
        if len(self.beat_times) < 4:
            return
        times = list(self.beat_times)
        intervals = [times[i + 1] - times[i] for i in range(len(times) - 1)]
        if not intervals:
            return
        median = float(np.median(intervals))
        valid = [i for i in intervals if 0.5 * median < i < 2.0 * median]
        if valid:
            avg = float(np.mean(valid))
            self.beat_interval = avg
            self.estimated_bpm = max(60.0, min(200.0, 60.0 / avg))
