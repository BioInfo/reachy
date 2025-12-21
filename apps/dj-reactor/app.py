"""
DJ Reactor - Music Visualizer for Reachy Mini

A physical music companion that analyzes audio and moves expressively to the beat.
"""

import argparse
import logging
import time
import threading
from typing import Optional
import numpy as np
import gradio as gr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import app modules
from config import DJReactorConfig, GENRE_PRESETS, get_available_genres
from audio_analyzer import AudioAnalyzer, AudioFeatures, list_audio_devices, get_default_input_device
from music_animations import MovementMapper, RobotController, wake_up_animation, wind_down_animation

# Import shared utilities
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from shared.reachy_utils import get_robot


class AppState:
    """Global application state."""

    def __init__(self):
        self.config = DJReactorConfig.load()
        self.robot_connection = None
        self.controller: Optional[RobotController] = None
        self.analyzer: Optional[AudioAnalyzer] = None
        self.mapper: Optional[MovementMapper] = None

        self.is_running = False
        self.is_vibing = False

        # Latest data for UI
        self.latest_features = AudioFeatures()
        self.status_message = "Ready to vibe"

        # Threading
        self.vibe_thread: Optional[threading.Thread] = None

    def initialize(self):
        """Initialize robot connection."""
        logger.info("Initializing DJ Reactor...")
        self.robot_connection = get_robot()
        logger.info(f"Robot connected: {not self.robot_connection.is_mock}")

        if not self.robot_connection.is_mock:
            self.controller = RobotController(self.robot_connection.robot)

    def start_vibing(self, genre: str, intensity: float, sensitivity: float, device_idx: Optional[int] = None):
        """Start the music reaction loop."""
        if self.is_vibing:
            return "Already vibing!"

        # Update config
        self.config.genre = genre
        self.config.intensity = intensity
        self.config.sensitivity = sensitivity

        # Initialize components
        preset = GENRE_PRESETS.get(genre, GENRE_PRESETS["electronic"])
        self.mapper = MovementMapper(preset, intensity, sensitivity)

        # Start audio analyzer
        self.analyzer = AudioAnalyzer(
            sample_rate=self.config.sample_rate,
            chunk_size=self.config.chunk_size,
            device_index=device_idx,
        )
        self.analyzer.start()

        self.is_vibing = True
        self.status_message = f"Vibing to {preset.display_name}!"

        # Wake up animation
        if self.controller:
            try:
                wake_up_animation(self.robot_connection.robot)
            except Exception as e:
                logger.error(f"Wake up animation failed: {e}")

        # Start vibe loop
        self.vibe_thread = threading.Thread(target=self._vibe_loop, daemon=True)
        self.vibe_thread.start()

        logger.info(f"Started vibing with genre: {genre}")
        return self.status_message

    def stop_vibing(self):
        """Stop the music reaction loop."""
        if not self.is_vibing:
            return "Not vibing"

        self.is_vibing = False

        # Wind down animation
        if self.controller:
            try:
                wind_down_animation(self.robot_connection.robot)
            except Exception as e:
                logger.error(f"Wind down animation failed: {e}")

        # Stop audio
        if self.analyzer:
            self.analyzer.stop()
            self.analyzer = None

        self.status_message = "Stopped vibing"
        logger.info("Stopped vibing")
        return self.status_message

    def _vibe_loop(self):
        """Main loop that processes audio and moves robot."""
        logger.info("Vibe loop started")

        while self.is_vibing:
            if self.analyzer is None or self.mapper is None:
                time.sleep(0.01)
                continue

            # Get latest audio features
            features = self.analyzer.get_latest()
            self.latest_features = features

            # Map to movement
            command = self.mapper.process(features)

            # Execute on robot
            if self.controller:
                self.controller.execute(command)

            # Update status
            if features.is_silent:
                self.status_message = "Waiting for music..."
            elif features.beat_detected:
                self.status_message = f"BPM: {features.bpm:.0f} - Beat!"
            else:
                self.status_message = f"BPM: {features.bpm:.0f} - Vibing..."

            # Rate limiting - aim for ~30 updates/second
            time.sleep(0.033)

        logger.info("Vibe loop ended")

    def change_genre(self, genre: str):
        """Change the active genre."""
        self.config.genre = genre
        preset = GENRE_PRESETS.get(genre, GENRE_PRESETS["electronic"])
        if self.mapper:
            self.mapper.update_preset(preset)
        self.status_message = f"Switched to {preset.display_name}"
        return self.status_message

    def update_intensity(self, intensity: float):
        """Update movement intensity."""
        self.config.intensity = intensity
        if self.mapper:
            self.mapper.update_intensity(intensity)

    def update_sensitivity(self, sensitivity: float):
        """Update beat sensitivity."""
        self.config.sensitivity = sensitivity
        if self.mapper:
            self.mapper.update_sensitivity(sensitivity)

    def get_display_data(self):
        """Get current data for UI update."""
        features = self.latest_features
        return {
            "status": self.status_message,
            "bpm": features.bpm,
            "bass": features.bass,
            "mid": features.mid,
            "treble": features.treble,
            "energy": features.rms,
            "is_vibing": self.is_vibing,
            "beat_detected": features.beat_detected,
            "robot_connected": self.robot_connection is not None and not self.robot_connection.is_mock,
        }

    def get_spectrum(self):
        """Get frequency spectrum for visualization."""
        if self.analyzer:
            return self.analyzer.get_spectrum()
        return np.zeros(100)


# Global state
app_state = AppState()


def update_ui():
    """Called periodically to update the UI."""
    data = app_state.get_display_data()

    # Status with indicator
    if data["is_vibing"]:
        status_color = "#4CAF50" if data["beat_detected"] else "#2196F3"
    else:
        status_color = "#666666"

    status_html = f"""
    <div style="text-align: center; padding: 20px;">
        <div style="display: inline-flex; align-items: center; gap: 10px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: {status_color};
                        box-shadow: 0 0 10px {status_color};"></div>
            <span style="font-size: 24px; font-weight: bold; color: #333;">
                {data['status']}
            </span>
        </div>
    </div>
    """

    # BPM display
    bpm_html = f"""
    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px; color: white;">
        <div style="font-size: 64px; font-weight: bold; font-family: monospace;">
            {data['bpm']:.0f}
        </div>
        <div style="font-size: 18px; opacity: 0.8;">BPM</div>
    </div>
    """

    # Energy meters
    def bar(value, color):
        width = int(value * 100)
        return f"""
        <div style="background: #e0e0e0; border-radius: 5px; height: 20px; overflow: hidden;">
            <div style="background: {color}; height: 100%; width: {width}%;
                        transition: width 0.1s ease;"></div>
        </div>
        """

    meters_html = f"""
    <div style="padding: 15px; background: #f5f5f5; border-radius: 10px;">
        <div style="margin-bottom: 10px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Bass</div>
            {bar(data['bass'], '#e91e63')}
        </div>
        <div style="margin-bottom: 10px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Mid</div>
            {bar(data['mid'], '#9c27b0')}
        </div>
        <div style="margin-bottom: 10px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Treble</div>
            {bar(data['treble'], '#3f51b5')}
        </div>
        <div>
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Energy</div>
            {bar(data['energy'], '#4CAF50')}
        </div>
    </div>
    """

    # Robot status
    robot_color = "#4CAF50" if data["robot_connected"] else "#FF9800"
    robot_text = "Reachy Connected" if data["robot_connected"] else "Mock (no daemon)"
    robot_html = f"""
    <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: {robot_color};"></div>
        <span style="color: #333; font-weight: 500;">{robot_text}</span>
    </div>
    """

    return status_html, bpm_html, meters_html, robot_html


def start_vibing(genre, intensity, sensitivity):
    """Start button handler."""
    # Get device index from stored selection
    device_idx = getattr(app_state, 'selected_device', None)
    app_state.start_vibing(genre, intensity, sensitivity, device_idx)
    return update_ui()


def stop_vibing():
    """Stop button handler."""
    app_state.stop_vibing()
    return update_ui()


def change_genre(genre):
    """Genre change handler."""
    app_state.change_genre(genre)
    return update_ui()


def update_intensity(intensity):
    """Intensity slider handler."""
    app_state.update_intensity(intensity)


def update_sensitivity(sensitivity):
    """Sensitivity slider handler."""
    app_state.update_sensitivity(sensitivity)


def select_device(device_name):
    """Audio device selection handler."""
    devices = list_audio_devices()
    for dev in devices:
        if dev['name'] == device_name:
            app_state.selected_device = dev['index']
            logger.info(f"Selected audio device: {device_name} (index {dev['index']})")
            return
    app_state.selected_device = None


def create_app():
    """Create the Gradio app."""
    # Get available audio devices
    audio_devices = list_audio_devices()
    device_names = [dev['name'] for dev in audio_devices]
    default_device = device_names[0] if device_names else "No devices found"

    # Get available genres
    genres = get_available_genres()
    genre_choices = [(display, name) for name, display in genres]

    with gr.Blocks(title="DJ Reactor", theme=gr.themes.Soft()) as demo:
        # Header
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; padding: 25px; border-radius: 15px; margin-bottom: 20px;
                    text-align: center;">
            <h1 style="margin: 0; font-size: 36px;">DJ Reactor</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">
                Your Reachy Mini dances to the music
            </p>
        </div>
        """)

        with gr.Row():
            # Left column - Controls
            with gr.Column(scale=1):
                # Audio device selection
                device_dropdown = gr.Dropdown(
                    choices=device_names,
                    value=default_device,
                    label="Audio Input Device",
                    info="Select microphone or loopback device"
                )

                # Genre selection
                genre_radio = gr.Radio(
                    choices=genre_choices,
                    value="electronic",
                    label="Music Genre",
                    info="Choose movement style"
                )

                # Intensity and sensitivity sliders
                intensity_slider = gr.Slider(
                    minimum=0.1, maximum=1.0, value=0.7, step=0.1,
                    label="Movement Intensity",
                    info="How dramatic the movements"
                )

                sensitivity_slider = gr.Slider(
                    minimum=0.2, maximum=1.0, value=0.6, step=0.1,
                    label="Beat Sensitivity",
                    info="How easily beats are detected"
                )

                # Control buttons
                with gr.Row():
                    start_btn = gr.Button("Start Vibing", variant="primary", size="lg")
                    stop_btn = gr.Button("Stop", variant="secondary", size="lg")

                # Robot status
                robot_status = gr.HTML(value=update_ui()[3])

            # Right column - Visualization
            with gr.Column(scale=1):
                # Status display
                status_display = gr.HTML(value=update_ui()[0])

                # BPM display
                bpm_display = gr.HTML(value=update_ui()[1])

                # Energy meters
                meters_display = gr.HTML(value=update_ui()[2])

        # No auto-refresh - UI updates on user actions only
        # The robot moves independently via the vibe loop thread

        # Event handlers
        device_dropdown.change(fn=select_device, inputs=[device_dropdown])

        genre_radio.change(
            fn=change_genre,
            inputs=[genre_radio],
            outputs=[status_display, bpm_display, meters_display, robot_status]
        )

        intensity_slider.change(fn=update_intensity, inputs=[intensity_slider])
        sensitivity_slider.change(fn=update_sensitivity, inputs=[sensitivity_slider])

        start_btn.click(
            fn=start_vibing,
            inputs=[genre_radio, intensity_slider, sensitivity_slider],
            outputs=[status_display, bpm_display, meters_display, robot_status]
        )

        stop_btn.click(
            fn=stop_vibing,
            outputs=[status_display, bpm_display, meters_display, robot_status]
        )

    return demo


def main():
    parser = argparse.ArgumentParser(description="DJ Reactor - Music Visualizer for Reachy Mini")
    parser.add_argument("--port", type=int, default=7861, help="Server port")
    parser.add_argument("--list-devices", action="store_true", help="List audio devices and exit")
    args = parser.parse_args()

    if args.list_devices:
        print("Available audio input devices:")
        for dev in list_audio_devices():
            print(f"  [{dev['index']}] {dev['name']} ({dev['channels']}ch, {dev['sample_rate']}Hz)")
        return

    # Initialize
    app_state.initialize()

    # Create and launch
    demo = create_app()
    demo.launch(server_port=args.port, show_error=True)


if __name__ == "__main__":
    main()
