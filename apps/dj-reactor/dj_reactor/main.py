"""
DJ Reactor - Music Visualizer for Reachy Mini

A physical music companion that analyzes audio and moves expressively to the beat.
Compatible with ReachyMiniApp format for HuggingFace/dashboard distribution.
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
# Configuration
# =============================================================================

BASS_RANGE = (20, 250)
MID_RANGE = (250, 2000)
TREBLE_RANGE = (2000, 12000)


@dataclass
class GenrePreset:
    """Movement characteristics for a music genre."""
    name: str
    display_name: str
    head_bob_amplitude: float = 8.0
    head_bob_speed: float = 1.0
    body_sway_amplitude: float = 20.0
    body_sway_speed: float = 1.0
    antenna_amplitude: float = 0.5
    emphasis_style: str = "nod"  # headbang, nod, tilt
    movement_smoothing: float = 0.3


GENRE_PRESETS = {
    "rock": GenrePreset(
        name="rock", display_name="Rock",
        head_bob_amplitude=18.0, head_bob_speed=1.0,
        body_sway_amplitude=70.0, antenna_amplitude=1.0,
        emphasis_style="headbang", movement_smoothing=0.2,
    ),
    "electronic": GenrePreset(
        name="electronic", display_name="Electronic/EDM",
        head_bob_amplitude=15.0, head_bob_speed=1.0,
        body_sway_amplitude=75.0, body_sway_speed=1.0,
        antenna_amplitude=0.9, emphasis_style="nod",
        movement_smoothing=0.25,
    ),
    "jazz": GenrePreset(
        name="jazz", display_name="Jazz",
        head_bob_amplitude=12.0, head_bob_speed=1.2,
        body_sway_amplitude=80.0, body_sway_speed=1.2,
        antenna_amplitude=0.7, emphasis_style="tilt",
        movement_smoothing=0.35,
    ),
    "pop": GenrePreset(
        name="pop", display_name="Pop",
        head_bob_amplitude=14.0, head_bob_speed=1.0,
        body_sway_amplitude=70.0, antenna_amplitude=0.8,
        emphasis_style="nod", movement_smoothing=0.25,
    ),
    "classical": GenrePreset(
        name="classical", display_name="Classical",
        head_bob_amplitude=10.0, head_bob_speed=1.5,
        body_sway_amplitude=85.0, body_sway_speed=1.5,
        antenna_amplitude=0.6, emphasis_style="tilt",
        movement_smoothing=0.4,
    ),
    "hiphop": GenrePreset(
        name="hiphop", display_name="Hip-Hop",
        head_bob_amplitude=16.0, head_bob_speed=0.9,
        body_sway_amplitude=65.0, antenna_amplitude=0.8,
        emphasis_style="nod", movement_smoothing=0.2,
    ),
    "chill": GenrePreset(
        name="chill", display_name="Chill/Ambient",
        head_bob_amplitude=10.0, head_bob_speed=1.5,
        body_sway_amplitude=75.0, body_sway_speed=1.5,
        antenna_amplitude=0.6, emphasis_style="tilt",
        movement_smoothing=0.45,
    ),
}


# =============================================================================
# Audio Analysis
# =============================================================================

@dataclass
class AudioFeatures:
    """Extracted audio features for a single frame."""
    bass: float = 0.0
    mid: float = 0.0
    treble: float = 0.0
    rms: float = 0.0
    beat_detected: bool = False
    onset_strength: float = 0.0  # How strong the beat onset is
    bpm: float = 120.0
    beat_phase: float = 0.0  # 0-1, position within current beat cycle
    is_silent: bool = True


class AudioAnalyzer:
    """Real-time audio analysis for beat detection and frequency bands."""

    def __init__(self, sample_rate: int = 44100, chunk_size: int = 2048,
                 device_index: Optional[int] = None, sensitivity: float = 0.6):
        self.sample_rate = sample_rate
        self.chunk_size = chunk_size
        self.device_index = device_index
        self.sensitivity = sensitivity

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
        self.beat_interval = 0.5  # seconds between beats (60/120 BPM)

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

        # Beat detection with sensitivity
        self.energy_history.append(rms)
        beat_detected = False
        onset_strength = 0.0
        onset_threshold = 1.1 + (1.0 - self.sensitivity) * 0.5  # Higher sensitivity = lower threshold
        min_interval = 0.2 + (1.0 - self.sensitivity) * 0.2

        if len(self.energy_history) >= 3:
            avg_energy = np.mean(list(self.energy_history)[:-1])
            onset = rms / (avg_energy + 1e-10)
            onset_strength = min(onset / onset_threshold, 2.0)  # Normalized onset strength
            if onset > onset_threshold and (current_time - self.last_beat_time) > min_interval and rms > 0.002:
                beat_detected = True
                self.beat_times.append(current_time)
                self.last_beat_time = current_time
                self._update_bpm()

        # Calculate beat phase (0-1 position within beat cycle)
        time_since_beat = current_time - self.last_beat_time
        beat_phase = (time_since_beat / self.beat_interval) % 1.0 if self.beat_interval > 0 else 0.0

        self.latest_features = AudioFeatures(
            bass=bass, mid=mid, treble=treble,
            rms=min(rms * 10, 1.0),
            beat_detected=beat_detected,
            onset_strength=onset_strength,
            bpm=self.estimated_bpm,
            beat_phase=beat_phase,
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
            avg_interval = np.mean(valid)
            self.beat_interval = avg_interval
            self.estimated_bpm = max(60, min(200, 60.0 / avg_interval))

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

    def update_sensitivity(self, sensitivity: float):
        """Update beat detection sensitivity."""
        self.sensitivity = max(0.2, min(1.0, sensitivity))


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
    """Maps audio to robot movements with genre-specific styles."""

    def __init__(self, preset: GenrePreset, intensity: float = 0.7):
        self.preset = preset
        self.intensity = intensity
        self.dance_time = 0.0

        # Smoothing state
        self.smooth_head_z = 0.0
        self.smooth_head_roll = 0.0
        self.smooth_body_yaw = 0.0
        self.smooth_antenna_l = 0.0
        self.smooth_antenna_r = 0.0

    def update_preset(self, preset: GenrePreset):
        """Change the active genre preset."""
        self.preset = preset

    def update_intensity(self, intensity: float):
        """Update movement intensity."""
        self.intensity = max(0.1, min(1.0, intensity))

    def get_movement(self, features: AudioFeatures):
        """Calculate movement based on audio features and genre preset."""
        self.dance_time += 0.1  # For tilt alternation, matches loop rate
        preset = self.preset

        # Use beat_phase (0-1) synced to actual detected beats, convert to radians
        phase = features.beat_phase * 2 * math.pi

        # Base energy - always move big, audio makes it bigger
        base_energy = 0.8 + 0.2 * features.rms  # Always at least 80% movement
        energy = base_energy * self.intensity

        # BODY SWAY - huge sweeping motion
        bass_boost = 0.8 + 0.5 * features.bass
        body_target = preset.body_sway_amplitude * energy * bass_boost * math.sin(phase * preset.body_sway_speed)

        # HEAD MOVEMENT - big dramatic bobbing and rolling
        mid_boost = 0.7 + 0.6 * features.mid
        head_z_target = preset.head_bob_amplitude * energy * 1.2 * math.sin(phase * preset.head_bob_speed)
        head_roll_target = preset.head_bob_amplitude * 2.0 * energy * mid_boost * math.sin(phase * 0.5)

        # Beat-triggered emphasis - really punch those beats
        head_pitch = 0
        if features.beat_detected:
            strength = max(features.onset_strength, 1.2) * self.intensity
            if preset.emphasis_style == "headbang":
                head_pitch = -35 * strength
            elif preset.emphasis_style == "nod":
                head_pitch = -25 * strength
            elif preset.emphasis_style == "tilt":
                head_roll_target += 30 * strength * (1 if self.dance_time % 2 > 1 else -1)

        # ANTENNAS - super bouncy and expressive
        treble_boost = 0.6 + 0.6 * features.treble
        ant_amp = preset.antenna_amplitude * energy * treble_boost * 2.0
        antenna_l_target = ant_amp * math.sin(phase * 2)
        antenna_r_target = ant_amp * math.sin(phase * 2 + math.pi)

        # Smoothing - apply to all movements for fluid motion
        smooth = preset.movement_smoothing
        self.smooth_head_z = smooth * self.smooth_head_z + (1 - smooth) * head_z_target
        self.smooth_head_roll = smooth * self.smooth_head_roll + (1 - smooth) * head_roll_target
        self.smooth_body_yaw = smooth * self.smooth_body_yaw + (1 - smooth) * body_target
        self.smooth_antenna_l = smooth * self.smooth_antenna_l + (1 - smooth) * antenna_l_target
        self.smooth_antenna_r = smooth * self.smooth_antenna_r + (1 - smooth) * antenna_r_target

        return {
            'head_z': max(-20, min(20, self.smooth_head_z)),
            'head_roll': max(-45, min(45, self.smooth_head_roll)),
            'head_pitch': max(-45, min(45, head_pitch)),
            'body_yaw': max(-55, min(55, self.smooth_body_yaw)),
            'antenna_left': max(-1.0, min(1.0, self.smooth_antenna_l)),
            'antenna_right': max(-1.0, min(1.0, self.smooth_antenna_r)),
        }


# =============================================================================
# ReachyMiniApp
# =============================================================================

class ReachyMiniDjReactor(ReachyMiniApp):
    """DJ Reactor - Music visualizer for Reachy Mini."""

    custom_app_url: str | None = "http://localhost:7861"
    dont_start_webserver: bool = True  # We handle Gradio ourselves
    request_media_backend: str | None = "no_media"  # DJ Reactor doesn't need camera

    def __init__(self):
        super().__init__()
        self.analyzer: Optional[AudioAnalyzer] = None
        self.controller: Optional[DanceController] = None
        self.is_vibing = False
        self.current_genre = "electronic"
        self.intensity = 0.7
        self.sensitivity = 0.6
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
                            duration=0.12,
                            method="minjerk"
                        )
                    except Exception as e:
                        logger.debug(f"Movement error: {e}")

            time.sleep(0.1)  # 10fps - let movements complete before next command

        # Cleanup
        if self.analyzer:
            self.analyzer.stop()

    def _run_ui(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Run Gradio UI with genre selection and visualizers."""
        devices = list_audio_devices()
        device_names = [d['name'] for d in devices]
        genre_choices = [(p.display_name, name) for name, p in GENRE_PRESETS.items()]

        def start_vibing(device_name, genre, intensity, sensitivity):
            if self.is_vibing:
                return get_status()

            # Find device index
            device_idx = None
            for d in devices:
                if d['name'] == device_name:
                    device_idx = d['index']
                    break

            self.current_genre = genre
            self.intensity = intensity
            self.sensitivity = sensitivity

            preset = GENRE_PRESETS.get(genre, GENRE_PRESETS["electronic"])
            self.controller = DanceController(preset, intensity)
            self.analyzer = AudioAnalyzer(device_index=device_idx, sensitivity=sensitivity)
            self.analyzer.start()
            self.is_vibing = True
            return get_status()

        def stop_vibing():
            self.is_vibing = False
            if self.analyzer:
                self.analyzer.stop()
                self.analyzer = None
            return get_status()

        def change_genre(genre):
            self.current_genre = genre
            if self.controller:
                preset = GENRE_PRESETS.get(genre, GENRE_PRESETS["electronic"])
                self.controller.update_preset(preset)
            return get_status()

        def update_intensity(intensity):
            self.intensity = intensity
            if self.controller:
                self.controller.update_intensity(intensity)

        def update_sensitivity(sensitivity):
            self.sensitivity = sensitivity
            if self.analyzer:
                self.analyzer.update_sensitivity(sensitivity)

        def bar(value, color):
            """Generate a colored bar HTML."""
            width = int(value * 100)
            return f'''<div style="background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                <div style="width: {width}%; height: 12px; background: {color}; transition: width 0.1s;"></div>
            </div>'''

        def get_status():
            f = self.latest_features
            status = "Vibing!" if self.is_vibing else "Ready"
            status_color = "#4CAF50" if self.is_vibing else "#666"
            beat_indicator = " *" if f.beat_detected and self.is_vibing else ""
            genre_name = GENRE_PRESETS.get(self.current_genre, GENRE_PRESETS["electronic"]).display_name

            return f"""
            <div style="padding: 15px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 18px; font-weight: bold; color: {status_color};">
                        {status}{beat_indicator}
                    </div>
                    <div style="font-size: 12px; color: #888; margin-top: 4px;">{genre_name}</div>
                </div>

                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; font-family: monospace; font-weight: bold;">
                        {f.bpm:.0f}
                    </div>
                    <div style="font-size: 14px; color: #666;">BPM</div>
                </div>

                <div style="background: #f5f5f5; padding: 15px; border-radius: 10px;">
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Bass</div>
                        {bar(f.bass, '#e91e63')}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Mid</div>
                        {bar(f.mid, '#9c27b0')}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Treble</div>
                        {bar(f.treble, '#3f51b5')}
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Energy</div>
                        {bar(f.rms, '#4CAF50')}
                    </div>
                </div>
            </div>
            """

        with gr.Blocks(title="DJ Reactor", theme=gr.themes.Soft()) as demo:
            gr.HTML("""
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 25px; border-radius: 15px; text-align: center;
                        margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 32px;">DJ Reactor</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Reachy Mini dances to your music</p>
            </div>
            """)

            with gr.Row():
                with gr.Column(scale=1):
                    device_dropdown = gr.Dropdown(
                        choices=device_names,
                        value=device_names[0] if device_names else None,
                        label="Audio Input Device",
                        info="Select microphone or loopback"
                    )

                    genre_radio = gr.Radio(
                        choices=genre_choices,
                        value="electronic",
                        label="Music Genre",
                        info="Movement style"
                    )

                    intensity_slider = gr.Slider(
                        0.1, 1.0, value=0.7, step=0.1,
                        label="Movement Intensity",
                        info="How dramatic the movements"
                    )

                    sensitivity_slider = gr.Slider(
                        0.2, 1.0, value=0.6, step=0.1,
                        label="Beat Sensitivity",
                        info="How easily beats are detected"
                    )

                    with gr.Row():
                        start_btn = gr.Button("Start Vibing", variant="primary", size="lg")
                        stop_btn = gr.Button("Stop", size="lg")

                with gr.Column(scale=1):
                    status_html = gr.HTML(value=get_status())

            # Auto-refresh status
            timer = gr.Timer(value=0.3)
            timer.tick(fn=get_status, outputs=[status_html])

            # Event handlers
            start_btn.click(
                fn=start_vibing,
                inputs=[device_dropdown, genre_radio, intensity_slider, sensitivity_slider],
                outputs=[status_html]
            )
            stop_btn.click(fn=stop_vibing, outputs=[status_html])
            genre_radio.change(fn=change_genre, inputs=[genre_radio], outputs=[status_html])
            intensity_slider.change(fn=update_intensity, inputs=[intensity_slider])
            sensitivity_slider.change(fn=update_sensitivity, inputs=[sensitivity_slider])

        demo.launch(server_port=7861, quiet=True, prevent_thread_lock=True)

        # Wait for stop
        while not stop_event.is_set():
            time.sleep(1)


# For standalone testing
if __name__ == "__main__":
    app = ReachyMiniDjReactor()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()
