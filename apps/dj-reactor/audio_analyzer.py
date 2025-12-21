"""
Real-time audio analysis for DJ Reactor.

Handles audio capture, beat detection, frequency analysis, and feature extraction.
"""

import numpy as np
import threading
import queue
import time
import logging
from dataclasses import dataclass
from typing import Optional, Callable
from collections import deque

try:
    import sounddevice as sd
except ImportError:
    sd = None

try:
    import librosa
except ImportError:
    librosa = None

from config import BASS_RANGE, MID_RANGE, TREBLE_RANGE

logger = logging.getLogger(__name__)


@dataclass
class AudioFeatures:
    """Extracted audio features for a single frame."""

    # Energy levels (0-1 normalized)
    bass: float = 0.0
    mid: float = 0.0
    treble: float = 0.0
    rms: float = 0.0  # Overall energy

    # Beat detection
    beat_detected: bool = False
    onset_strength: float = 0.0

    # Tempo
    bpm: float = 120.0
    beat_phase: float = 0.0  # 0-1, position in beat

    # State
    is_silent: bool = True
    timestamp: float = 0.0


class BeatTracker:
    """Tracks beats and estimates BPM from audio."""

    def __init__(self, sample_rate: int = 44100, hop_length: int = 512):
        self.sample_rate = sample_rate
        self.hop_length = hop_length

        # Beat tracking state
        self.onset_history = deque(maxlen=100)
        self.beat_times = deque(maxlen=50)
        self.last_beat_time = 0.0
        self.estimated_bpm = 120.0
        self.beat_interval = 0.5  # seconds

        # Energy tracking for onset detection
        self.energy_history = deque(maxlen=10)
        self.onset_threshold = 1.3  # Relative to recent average (lower = more sensitive)

    def process(self, audio_chunk: np.ndarray, current_time: float) -> tuple[bool, float]:
        """
        Process audio chunk and return (beat_detected, onset_strength).
        """
        # Calculate spectral flux / onset strength
        energy = np.sqrt(np.mean(audio_chunk ** 2))
        self.energy_history.append(energy)

        if len(self.energy_history) < 3:
            return False, 0.0

        avg_energy = np.mean(list(self.energy_history)[:-1])
        onset_strength = energy / (avg_energy + 1e-10)

        # Detect beat if onset is strong enough and enough time has passed
        min_interval = self.beat_interval * 0.7  # Allow some variation
        time_since_last = current_time - self.last_beat_time

        beat_detected = (
            onset_strength > self.onset_threshold
            and time_since_last > min_interval
            and energy > 0.002  # Not silence (lowered for mic input)
        )

        if beat_detected:
            self.beat_times.append(current_time)
            self.last_beat_time = current_time
            self._update_bpm()

        return beat_detected, min(onset_strength / self.onset_threshold, 2.0)

    def _update_bpm(self):
        """Update BPM estimate from recent beat times."""
        if len(self.beat_times) < 4:
            return

        # Calculate intervals between beats
        times = list(self.beat_times)
        intervals = [times[i+1] - times[i] for i in range(len(times) - 1)]

        # Filter outliers
        median_interval = np.median(intervals)
        valid_intervals = [i for i in intervals if 0.5 * median_interval < i < 2 * median_interval]

        if valid_intervals:
            avg_interval = np.mean(valid_intervals)
            self.beat_interval = avg_interval
            self.estimated_bpm = 60.0 / avg_interval

            # Clamp to reasonable range
            self.estimated_bpm = max(60, min(200, self.estimated_bpm))

    def get_beat_phase(self, current_time: float) -> float:
        """Get current position within beat cycle (0-1)."""
        if self.beat_interval <= 0:
            return 0.0
        time_since_beat = current_time - self.last_beat_time
        return (time_since_beat / self.beat_interval) % 1.0


class FrequencyAnalyzer:
    """Analyzes frequency content of audio."""

    def __init__(self, sample_rate: int = 44100, fft_size: int = 2048):
        self.sample_rate = sample_rate
        self.fft_size = fft_size

        # Pre-calculate frequency bin indices
        freqs = np.fft.rfftfreq(fft_size, 1.0 / sample_rate)
        self.bass_bins = np.where((freqs >= BASS_RANGE[0]) & (freqs <= BASS_RANGE[1]))[0]
        self.mid_bins = np.where((freqs >= MID_RANGE[0]) & (freqs <= MID_RANGE[1]))[0]
        self.treble_bins = np.where((freqs >= TREBLE_RANGE[0]) & (freqs <= TREBLE_RANGE[1]))[0]

        # Smoothing
        self.bass_smooth = 0.0
        self.mid_smooth = 0.0
        self.treble_smooth = 0.0
        self.smoothing_factor = 0.3

    def process(self, audio_chunk: np.ndarray) -> tuple[float, float, float, np.ndarray]:
        """
        Analyze frequency content.
        Returns (bass, mid, treble, spectrum) all normalized 0-1.
        """
        # Apply window
        windowed = audio_chunk * np.hanning(len(audio_chunk))

        # Pad if necessary
        if len(windowed) < self.fft_size:
            windowed = np.pad(windowed, (0, self.fft_size - len(windowed)))

        # FFT
        spectrum = np.abs(np.fft.rfft(windowed[:self.fft_size]))

        # Extract band energies
        bass_energy = np.mean(spectrum[self.bass_bins]) if len(self.bass_bins) > 0 else 0
        mid_energy = np.mean(spectrum[self.mid_bins]) if len(self.mid_bins) > 0 else 0
        treble_energy = np.mean(spectrum[self.treble_bins]) if len(self.treble_bins) > 0 else 0

        # Normalize (lowered divisors for mic input sensitivity)
        bass = min(bass_energy / 10.0, 1.0)
        mid = min(mid_energy / 8.0, 1.0)
        treble = min(treble_energy / 5.0, 1.0)

        # Smooth
        self.bass_smooth = self.bass_smooth * self.smoothing_factor + bass * (1 - self.smoothing_factor)
        self.mid_smooth = self.mid_smooth * self.smoothing_factor + mid * (1 - self.smoothing_factor)
        self.treble_smooth = self.treble_smooth * self.smoothing_factor + treble * (1 - self.smoothing_factor)

        # Normalize spectrum for visualization
        spectrum_normalized = spectrum / (np.max(spectrum) + 1e-10)

        return self.bass_smooth, self.mid_smooth, self.treble_smooth, spectrum_normalized


class AudioAnalyzer:
    """
    Main audio analysis class.
    Captures audio and produces AudioFeatures in real-time.
    """

    def __init__(
        self,
        sample_rate: int = 44100,
        chunk_size: int = 2048,
        device_index: Optional[int] = None,
        callback: Optional[Callable[[AudioFeatures], None]] = None
    ):
        if sd is None:
            raise ImportError("sounddevice is required: pip install sounddevice")

        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.device_index = device_index
        self.callback = callback

        # Analysis components
        self.beat_tracker = BeatTracker(sample_rate)
        self.freq_analyzer = FrequencyAnalyzer(sample_rate)

        # State
        self.is_running = False
        self.stream = None
        self.start_time = 0.0

        # Feature queue for async access
        self.feature_queue: queue.Queue[AudioFeatures] = queue.Queue(maxsize=10)
        self.latest_features = AudioFeatures()

        # Spectrum for visualization
        self.latest_spectrum = np.zeros(self.chunk_size // 2 + 1)

        # Silence detection (lowered for mic input)
        self.silence_threshold = 0.001
        self.frames_silent = 0

    def _audio_callback(self, indata, frames, time_info, status):
        """Callback for sounddevice stream."""
        if status:
            logger.warning(f"Audio status: {status}")

        # Convert to mono if stereo
        if len(indata.shape) > 1:
            audio = np.mean(indata, axis=1)
        else:
            audio = indata.flatten()

        current_time = time.time() - self.start_time

        # RMS energy
        rms = np.sqrt(np.mean(audio ** 2))
        is_silent = rms < self.silence_threshold

        if is_silent:
            self.frames_silent += 1
        else:
            self.frames_silent = 0

        # Beat detection
        beat_detected, onset_strength = self.beat_tracker.process(audio, current_time)

        # Frequency analysis
        bass, mid, treble, spectrum = self.freq_analyzer.process(audio)
        self.latest_spectrum = spectrum

        # Create features
        features = AudioFeatures(
            bass=bass,
            mid=mid,
            treble=treble,
            rms=min(rms * 10, 1.0),  # Scale for visualization
            beat_detected=beat_detected,
            onset_strength=onset_strength,
            bpm=self.beat_tracker.estimated_bpm,
            beat_phase=self.beat_tracker.get_beat_phase(current_time),
            is_silent=is_silent and self.frames_silent > 10,
            timestamp=current_time,
        )

        self.latest_features = features

        # Queue for polling
        try:
            self.feature_queue.put_nowait(features)
        except queue.Full:
            pass  # Drop old features

        # Callback
        if self.callback:
            self.callback(features)

    def start(self):
        """Start audio capture and analysis."""
        if self.is_running:
            return

        logger.info(f"Starting audio capture (device: {self.device_index}, rate: {self.sample_rate})")

        self.start_time = time.time()
        self.is_running = True

        self.stream = sd.InputStream(
            device=self.device_index,
            channels=1,
            samplerate=self.sample_rate,
            blocksize=self.chunk_size,
            callback=self._audio_callback,
        )
        self.stream.start()
        logger.info("Audio capture started")

    def stop(self):
        """Stop audio capture."""
        self.is_running = False
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None
        logger.info("Audio capture stopped")

    def get_features(self, timeout: float = 0.1) -> Optional[AudioFeatures]:
        """Get the next audio features from the queue."""
        try:
            return self.feature_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def get_latest(self) -> AudioFeatures:
        """Get the most recent features (non-blocking)."""
        return self.latest_features

    def get_spectrum(self) -> np.ndarray:
        """Get the latest frequency spectrum for visualization."""
        return self.latest_spectrum


def list_audio_devices() -> list[dict]:
    """List available audio input devices."""
    if sd is None:
        return []

    devices = sd.query_devices()
    input_devices = []

    for i, dev in enumerate(devices):
        if dev['max_input_channels'] > 0:
            input_devices.append({
                'index': i,
                'name': dev['name'],
                'channels': dev['max_input_channels'],
                'sample_rate': dev['default_samplerate'],
            })

    return input_devices


def get_default_input_device() -> Optional[int]:
    """Get the default input device index."""
    if sd is None:
        return None
    try:
        return sd.default.device[0]
    except Exception:
        return None


# Test mode
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--device", type=int, default=None, help="Audio device index")
    parser.add_argument("--list", action="store_true", help="List audio devices")
    parser.add_argument("--test", action="store_true", help="Run test visualization")
    args = parser.parse_args()

    if args.list:
        print("Available audio input devices:")
        for dev in list_audio_devices():
            print(f"  [{dev['index']}] {dev['name']} ({dev['channels']}ch, {dev['sample_rate']}Hz)")
        exit(0)

    if args.test:
        def on_features(f: AudioFeatures):
            beat_marker = "*" if f.beat_detected else " "
            bar_bass = "#" * int(f.bass * 20)
            bar_mid = "#" * int(f.mid * 20)
            bar_treble = "#" * int(f.treble * 20)
            print(f"{beat_marker} BPM:{f.bpm:5.1f} | Bass:{bar_bass:<20} | Mid:{bar_mid:<20} | Treble:{bar_treble:<20}", end="\r")

        analyzer = AudioAnalyzer(device_index=args.device, callback=on_features)
        analyzer.start()

        try:
            print("Listening... Press Ctrl+C to stop")
            while True:
                time.sleep(0.1)
        except KeyboardInterrupt:
            pass
        finally:
            analyzer.stop()
