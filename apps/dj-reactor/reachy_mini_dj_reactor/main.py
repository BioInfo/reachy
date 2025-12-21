"""
DJ Reactor - Music Visualizer for Reachy Mini

A physical music companion that analyzes audio and moves expressively to the beat.
"""

import math
import time
import threading
import logging
from dataclasses import dataclass
from typing import Optional
from collections import deque

import numpy as np
import gradio as gr

try:
    import sounddevice as sd
except ImportError:
    sd = None

from reachy_mini import ReachyMini, ReachyMiniApp
from reachy_mini.utils import create_head_pose

logger = logging.getLogger(__name__)

# =============================================================================
# Audio Analysis
# =============================================================================

BASS_RANGE = (20, 250)
MID_RANGE = (250, 2000)
TREBLE_RANGE = (2000, 12000)


@dataclass
class AudioFeatures:
    """Extracted audio features for a single frame."""
    bass: float = 0.0
    mid: float = 0.0
    treble: float = 0.0
    rms: float = 0.0
    beat_detected: bool = False
    bpm: float = 120.0
    is_silent: bool = True


class AudioAnalyzer:
    """Real-time audio analysis for beat detection and frequency bands."""

    def __init__(self, sample_rate: int = 44100, chunk_size: int = 2048, device_index: Optional[int] = None):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.device_index = device_index

        # FFT setup
        freqs = np.fft.rfftfreq(chunk_size, 1.0 / sample_rate)
        self.bass_bins = np.where((freqs >= BASS_RANGE[0]) & (freqs <= BASS_RANGE[1]))[0]
        self.mid_bins = np.where((freqs >= MID_RANGE[0]) & (freqs <= MID_RANGE[1]))[0]
        self.treble_bins = np.where((freqs >= TREBLE_RANGE[0]) & (freqs <= TREBLE_RANGE[1]))[0]

        # Beat tracking
        self.energy_history = deque(maxlen=10)
        self.beat_times = deque(maxlen=50)
        self.last_beat_time = 0.0
        self.estimated_bpm = 120.0

        # State
        self.is_running = False
        self.stream = None
        self.latest_features = AudioFeatures()
        self.start_time = 0.0

    def _audio_callback(self, indata, frames, time_info, status):
        """Process incoming audio data."""
        if len(indata.shape) > 1:
            audio = np.mean(indata, axis=1)
        else:
            audio = indata.flatten()

        current_time = time.time() - self.start_time

        # RMS energy
        rms = np.sqrt(np.mean(audio ** 2))
        is_silent = rms < 0.001

        # FFT analysis
        windowed = audio * np.hanning(len(audio))
        if len(windowed) < self.chunk_size:
            windowed = np.pad(windowed, (0, self.chunk_size - len(windowed)))
        spectrum = np.abs(np.fft.rfft(windowed[:self.chunk_size]))

        # Extract band energies (normalized for loopback audio)
        bass = min(np.mean(spectrum[self.bass_bins]) / 3.0, 1.0) if len(self.bass_bins) > 0 else 0
        mid = min(np.mean(spectrum[self.mid_bins]) / 2.0, 1.0) if len(self.mid_bins) > 0 else 0
        treble = min(np.mean(spectrum[self.treble_bins]) / 1.0, 1.0) if len(self.treble_bins) > 0 else 0

        # Beat detection
        self.energy_history.append(rms)
        beat_detected = False
        if len(self.energy_history) >= 3:
            avg_energy = np.mean(list(self.energy_history)[:-1])
            onset = rms / (avg_energy + 1e-10)
            if onset > 1.3 and (current_time - self.last_beat_time) > 0.3 and rms > 0.002:
                beat_detected = True
                self.beat_times.append(current_time)
                self.last_beat_time = current_time
                self._update_bpm()

        self.latest_features = AudioFeatures(
            bass=bass, mid=mid, treble=treble,
            rms=min(rms * 10, 1.0),
            beat_detected=beat_detected,
            bpm=self.estimated_bpm,
            is_silent=is_silent
        )

    def _update_bpm(self):
        """Estimate BPM from beat times."""
        if len(self.beat_times) < 4:
            return
        times = list(self.beat_times)
        intervals = [times[i+1] - times[i] for i in range(len(times) - 1)]
        median = np.median(intervals)
        valid = [i for i in intervals if 0.5 * median < i < 2 * median]
        if valid:
            self.estimated_bpm = max(60, min(200, 60.0 / np.mean(valid)))

    def start(self):
        """Start audio capture."""
        if self.is_running or sd is None:
            return
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

    def get_latest(self) -> AudioFeatures:
        """Get most recent audio features."""
        return self.latest_features


def list_audio_devices():
    """List available audio input devices."""
    if sd is None:
        return []
    devices = []
    for i, dev in enumerate(sd.query_devices()):
        if dev['max_input_channels'] > 0:
            devices.append({'index': i, 'name': dev['name']})
    return devices


# =============================================================================
# Movement System
# =============================================================================

class DanceController:
    """Maps audio to robot movements."""

    def __init__(self, intensity: float = 0.7):
        self.intensity = intensity
        self.dance_time = 0.0

    def get_movement(self, features: AudioFeatures):
        """Calculate movement based on audio features."""
        self.dance_time += 0.1

        # Groove cycle synced to BPM
        bpm_factor = features.bpm / 120.0
        phase = (self.dance_time * 1.5 * bpm_factor) % (2 * math.pi)

        # Energy scaling
        energy = max(features.rms, 0.3) * self.intensity

        # Body sway
        body_yaw = 40 * energy * math.sin(phase)

        # Head movement
        head_z = 10 * energy * math.sin(phase)
        head_roll = 20 * energy * math.sin(phase)
        head_pitch = -15 * self.intensity if features.beat_detected else 0

        # Antennas
        ant_amp = 0.6 * energy
        antenna_l = ant_amp * math.sin(phase * 2)
        antenna_r = ant_amp * math.sin(phase * 2 + math.pi)

        return {
            'head_z': max(-15, min(15, head_z)),
            'head_roll': max(-40, min(40, head_roll)),
            'head_pitch': max(-40, min(40, head_pitch)),
            'body_yaw': max(-50, min(50, body_yaw)),
            'antenna_left': max(-0.7, min(0.7, antenna_l)),
            'antenna_right': max(-0.7, min(0.7, antenna_r)),
        }


# =============================================================================
# ReachyMiniApp
# =============================================================================

class DJReactorApp(ReachyMiniApp):
    """DJ Reactor - Music visualizer for Reachy Mini."""

    custom_app_url: str | None = "http://localhost:7861"
    dont_start_webserver: bool = True  # We handle Gradio ourselves
    request_media_backend: str | None = "no_media"  # DJ Reactor doesn't need camera

    def __init__(self):
        super().__init__()
        self.analyzer: Optional[AudioAnalyzer] = None
        self.controller: Optional[DanceController] = None
        self.is_vibing = False
        self.selected_device = None
        self.intensity = 0.7
        self.latest_features = AudioFeatures()

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Main loop - called by dashboard."""

        # Start Gradio UI in background
        ui_thread = threading.Thread(
            target=self._run_ui,
            args=(reachy_mini, stop_event),
            daemon=True
        )
        ui_thread.start()

        # Main dance loop
        while not stop_event.is_set():
            if self.is_vibing and self.analyzer and self.controller:
                features = self.analyzer.get_latest()
                self.latest_features = features

                if not features.is_silent:
                    movement = self.controller.get_movement(features)
                    try:
                        head_pose = create_head_pose(
                            z=movement['head_z'],
                            roll=movement['head_roll'],
                            mm=True,
                            degrees=True
                        )
                        reachy_mini.goto_target(
                            head=head_pose,
                            antennas=[movement['antenna_left'], movement['antenna_right']],
                            body_yaw=np.deg2rad(movement['body_yaw']),
                            duration=0.3,
                            method="minjerk"
                        )
                    except Exception as e:
                        logger.debug(f"Movement error: {e}")

            time.sleep(0.1)

        # Cleanup
        if self.analyzer:
            self.analyzer.stop()

    def _run_ui(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Run Gradio UI."""
        devices = list_audio_devices()
        device_names = [d['name'] for d in devices]

        def start_vibing(device_name, intensity):
            if self.is_vibing:
                return "Already vibing!"

            # Find device index
            device_idx = None
            for d in devices:
                if d['name'] == device_name:
                    device_idx = d['index']
                    break

            self.intensity = intensity
            self.controller = DanceController(intensity)
            self.analyzer = AudioAnalyzer(device_index=device_idx)
            self.analyzer.start()
            self.is_vibing = True
            return "Vibing!"

        def stop_vibing():
            self.is_vibing = False
            if self.analyzer:
                self.analyzer.stop()
                self.analyzer = None
            return "Stopped"

        def get_status():
            f = self.latest_features
            status = "Vibing!" if self.is_vibing else "Ready"
            return f"""
            <div style="text-align:center; padding:20px;">
                <h2 style="color: {'#4CAF50' if self.is_vibing else '#666'};">{status}</h2>
                <div style="font-size:48px; font-family:monospace;">{f.bpm:.0f} BPM</div>
                <div style="margin-top:20px;">
                    <div>Bass: {'#' * int(f.bass * 20)}</div>
                    <div>Mid: {'#' * int(f.mid * 20)}</div>
                    <div>Treble: {'#' * int(f.treble * 20)}</div>
                </div>
            </div>
            """

        with gr.Blocks(title="DJ Reactor") as demo:
            gr.HTML("""
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 25px; border-radius: 15px; text-align: center;">
                <h1 style="margin: 0;">DJ Reactor</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Reachy Mini dances to your music</p>
            </div>
            """)

            with gr.Row():
                with gr.Column():
                    device_dropdown = gr.Dropdown(
                        choices=device_names,
                        value=device_names[0] if device_names else None,
                        label="Audio Input"
                    )
                    intensity_slider = gr.Slider(0.1, 1.0, value=0.7, label="Intensity")
                    with gr.Row():
                        start_btn = gr.Button("Start Vibing", variant="primary")
                        stop_btn = gr.Button("Stop")

                with gr.Column():
                    status_html = gr.HTML(value=get_status())

            timer = gr.Timer(value=0.5)
            timer.tick(fn=get_status, outputs=[status_html])

            start_btn.click(fn=start_vibing, inputs=[device_dropdown, intensity_slider], outputs=[status_html])
            stop_btn.click(fn=stop_vibing, outputs=[status_html])

        demo.launch(server_port=7861, quiet=True, prevent_thread_lock=True)

        # Wait for stop
        while not stop_event.is_set():
            time.sleep(1)


# For standalone testing
if __name__ == "__main__":
    app = DJReactorApp()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()
