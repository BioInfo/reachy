"""
Focus Guardian - Productivity Body-Double for Reachy Mini

A physical productivity companion that monitors your attention during
deep work sessions and provides real-time feedback through expressive
robot movements.
"""

import argparse
import logging
import time
import threading
from typing import Optional
import gradio as gr
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import app modules
from config import FocusConfig, get_nudge_action
from focus_session import FocusSession, SessionState, DailyTracker

# Import shared utilities
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from shared.reachy_utils import (
    get_robot,
    victory_dance,
    disappointed_shake,
    attention_wiggle,
)
from shared.reachy_utils.animations import focus_mode_enter, focus_mode_exit


# Global app state
class AppState:
    def __init__(self):
        self.config = FocusConfig.load()
        self.session: Optional[FocusSession] = None
        self.daily_tracker = DailyTracker()
        self.robot = None
        self.is_running = False
        self.last_status = "Ready to focus"

    def initialize(self):
        """Initialize robot connection."""
        logger.info("Initializing Focus Guardian...")
        self.robot = get_robot(simulation=self.config.simulation_mode)
        logger.info(f"Robot connected: {not self.robot.is_mock}")

    def start_session(self, duration_mins, distraction_threshold, nudge_intensity):
        """Start a new focus session."""
        if self.session and self.session.state in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return "Session already active!"

        # Update config
        self.config.session_duration_minutes = duration_mins
        self.config.distraction_threshold_seconds = distraction_threshold
        self.config.nudge_intensity = nudge_intensity

        # Create session
        self.session = FocusSession(
            duration_minutes=duration_mins,
            distraction_threshold_seconds=distraction_threshold,
            nudge_cooldown_seconds=30,
            on_nudge=self._handle_nudge,
            on_complete=self._handle_complete,
        )

        self.session.start()
        self.is_running = True
        self.last_status = "Focus mode active!"

        # Robot animation
        if self.robot and not self.robot.is_mock:
            try:
                focus_mode_enter(self.robot.robot)
            except Exception as e:
                logger.error(f"Robot animation failed: {e}")

        # Start background timer
        thread = threading.Thread(target=self._timer_loop, daemon=True)
        thread.start()

        logger.info(f"Focus session started: {duration_mins} minutes")
        return "Focus mode active!"

    def stop_session(self):
        """Stop the current session."""
        if not self.session:
            return "No active session"

        self.is_running = False
        was_completed = self.session.remaining_seconds <= 0

        if was_completed:
            self.session.stop(cancelled=False)
            self.last_status = "Session completed!"
        else:
            self.session.stop(cancelled=True)
            self.last_status = "Session ended early"

        # Robot animation
        if self.robot and not self.robot.is_mock:
            try:
                focus_mode_exit(self.robot.robot)
            except Exception as e:
                logger.error(f"Robot animation failed: {e}")

        return self.last_status

    def _timer_loop(self):
        """Background timer loop."""
        tick_count = 0
        logger.info("Timer loop started")

        while self.is_running and self.session:
            time.sleep(1.0)
            self.session.tick(1.0)
            tick_count += 1

            # Simulate distraction in simulation mode for testing
            if self.config.simulation_mode and tick_count >= 10 and (tick_count - 10) % 30 == 0:
                logger.info("SIMULATION: Triggering distraction")
                for i in range(12):
                    if not self.is_running:
                        break
                    self.session.update_attention(is_focused=False)
                    time.sleep(1.0)
                    self.session.tick(1.0)
                if self.is_running:
                    self.session.update_attention(is_focused=True)

            # Check if completed
            if self.session.remaining_seconds <= 0:
                self._complete_session()
                break

    def _complete_session(self):
        """Handle natural session completion."""
        self.is_running = False
        self.last_status = "Session completed! Great job!"

        if self.robot and not self.robot.is_mock:
            try:
                victory_dance(self.robot.robot, duration=3.0)
            except Exception as e:
                logger.error(f"Victory dance failed: {e}")

        self.session.stop(cancelled=False)

    def _handle_nudge(self, nudge_count: int):
        """Handle nudge callback."""
        logger.info(f"Nudge #{nudge_count}")
        self.last_status = f"Hey! Focus up! (Nudge #{nudge_count})"

        if self.robot and not self.robot.is_mock:
            try:
                if nudge_count <= 1:
                    attention_wiggle(self.robot.robot)
                else:
                    disappointed_shake(self.robot.robot, intensity=min(1.0, nudge_count * 0.3))
            except Exception as e:
                logger.error(f"Nudge animation failed: {e}")

    def _handle_complete(self, stats):
        """Handle session completion."""
        logger.info(f"Session complete! Focus score: {stats.focus_score:.1f}%")
        self.daily_tracker.add_session(stats)

    def get_display_data(self):
        """Get current display data for UI update."""
        if self.session and self.session.state in (SessionState.FOCUSING, SessionState.DISTRACTED):
            remaining = self.session.remaining_formatted
            stats = self.session.get_stats()
            focus_score = stats.get("focus_score", 0)
            nudges = stats.get("nudge_count", 0)
            state = "focusing" if self.session.state == SessionState.FOCUSING else "distracted"
        else:
            remaining = f"{self.config.session_duration_minutes:02d}:00"
            focus_score = self.daily_tracker.average_focus_score
            nudges = self.daily_tracker.total_nudges
            state = "idle"

        return {
            "timer": remaining,
            "status": self.last_status,
            "sessions": self.daily_tracker.sessions_completed,
            "focus_score": focus_score,
            "nudges": nudges,
            "state": state,
            "robot_connected": self.robot is not None and not self.robot.is_mock,
        }


# Global state instance
app_state = AppState()


def update_ui():
    """Called every second to update the UI."""
    data = app_state.get_display_data()

    # Timer color based on state
    if data["state"] == "focusing":
        timer_color = "#4CAF50"  # Green
    elif data["state"] == "distracted":
        timer_color = "#FF9800"  # Orange
    else:
        timer_color = "#333333"  # Gray

    # Format score color
    score = data["focus_score"]
    if score >= 80:
        score_color = "#4CAF50"
    elif score >= 50:
        score_color = "#FF9800"
    else:
        score_color = "#f44336"

    timer_html = f"""
    <div style="text-align: center; padding: 20px;">
        <div style="font-size: 80px; font-weight: bold; color: {timer_color}; font-family: monospace;">
            {data['timer']}
        </div>
        <div style="font-size: 20px; color: #666; margin-top: 10px;">
            {data['status']}
        </div>
    </div>
    """

    stats_html = f"""
    <div style="display: flex; justify-content: space-around; padding: 20px; background: #f5f5f5; border-radius: 10px;">
        <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">{data['sessions']}</div>
            <div style="font-size: 14px; color: #666;">Sessions</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: {score_color};">{score:.0f}%</div>
            <div style="font-size: 14px; color: #666;">Focus Score</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #FF9800;">{data['nudges']}</div>
            <div style="font-size: 14px; color: #666;">Nudges</div>
        </div>
    </div>
    """

    robot_color = "#4CAF50" if data["robot_connected"] else "#FF9800"
    robot_text = "Reachy Connected" if data["robot_connected"] else "Mock (no daemon)"
    sim_text = " + Auto-Distraction" if app_state.config.simulation_mode else ""

    robot_html = f"""
    <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: {robot_color};"></div>
        <span style="color: #333; font-weight: 500;">{robot_text}{sim_text}</span>
    </div>
    """

    return timer_html, stats_html, robot_html


def start_session(duration, threshold, intensity):
    """Start button handler."""
    result = app_state.start_session(int(duration), float(threshold), intensity)
    return update_ui()


def stop_session():
    """Stop button handler."""
    result = app_state.stop_session()
    return update_ui()


def toggle_mode(use_simulation):
    """Toggle distraction simulation on/off (robot connection stays the same)."""
    app_state.config.simulation_mode = use_simulation
    mode = "ON" if use_simulation else "OFF"
    logger.info(f"Distraction simulation: {mode}")
    return update_ui()


def create_app():
    """Create the Gradio app."""

    with gr.Blocks(title="Focus Guardian") as demo:
        # Header
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">Focus Guardian</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Your productivity body-double powered by Reachy Mini</p>
        </div>
        """)

        with gr.Row():
            with gr.Column(scale=1):
                # Timer display
                timer_display = gr.HTML(value=update_ui()[0])

                # Buttons
                with gr.Row():
                    start_btn = gr.Button("Start Focus Session", variant="primary", size="lg")
                    stop_btn = gr.Button("End Session", variant="secondary", size="lg")

                # Stats
                stats_display = gr.HTML(value=update_ui()[1])

                # Robot status
                robot_status = gr.HTML(value=update_ui()[2])

                # Mode toggle
                mode_toggle = gr.Checkbox(
                    label="Simulate Distractions",
                    value=app_state.config.simulation_mode,
                    info="Auto-trigger distractions for testing (robot always real)"
                )

            with gr.Column(scale=1):
                # Camera feed
                gr.Markdown("### Camera Feed")
                camera = gr.Image(
                    sources=["webcam"],
                    streaming=True,
                    label="",
                    mirror_webcam=True,
                )

        # Settings in accordion
        with gr.Accordion("Settings", open=False):
            with gr.Row():
                duration_slider = gr.Slider(
                    minimum=1, maximum=60, value=25, step=1,
                    label="Session Duration (minutes)"
                )
                threshold_slider = gr.Slider(
                    minimum=3, maximum=30, value=10, step=1,
                    label="Distraction Threshold (seconds)"
                )
                intensity_radio = gr.Radio(
                    choices=["low", "medium", "high"],
                    value="medium",
                    label="Nudge Intensity"
                )

        # Auto-refresh timer (every 1 second)
        timer = gr.Timer(value=1)
        timer.tick(fn=update_ui, outputs=[timer_display, stats_display, robot_status])

        # Mode toggle handler
        mode_toggle.change(
            fn=toggle_mode,
            inputs=[mode_toggle],
            outputs=[timer_display, stats_display, robot_status]
        )

        # Button handlers
        start_btn.click(
            fn=start_session,
            inputs=[duration_slider, threshold_slider, intensity_radio],
            outputs=[timer_display, stats_display, robot_status]
        )

        stop_btn.click(
            fn=stop_session,
            outputs=[timer_display, stats_display, robot_status]
        )

    return demo


def main():
    parser = argparse.ArgumentParser(description="Focus Guardian")
    parser.add_argument("--simulation", action="store_true", help="Run in simulation mode")
    parser.add_argument("--port", type=int, default=7860, help="Server port")
    args = parser.parse_args()

    # Configure
    app_state.config.simulation_mode = args.simulation

    # Initialize
    app_state.initialize()

    # Create and launch
    demo = create_app()
    demo.launch(server_port=args.port, show_error=True)


if __name__ == "__main__":
    main()
