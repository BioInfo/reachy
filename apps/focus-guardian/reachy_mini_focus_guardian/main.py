"""
Focus Guardian - Productivity Body-Double for Reachy Mini

A physical productivity companion that monitors your attention during
deep work sessions and provides real-time feedback through expressive
robot movements.
"""

import math
import time
import threading
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional
from datetime import datetime

import numpy as np
import gradio as gr

from reachy_mini import ReachyMini, ReachyMiniApp
from reachy_mini.utils import create_head_pose

logger = logging.getLogger(__name__)


# =============================================================================
# Session Management
# =============================================================================

class SessionState(Enum):
    IDLE = "idle"
    FOCUSING = "focusing"
    DISTRACTED = "distracted"
    COMPLETED = "completed"


@dataclass
class SessionStats:
    duration_seconds: int = 0
    time_focused_seconds: int = 0
    time_distracted_seconds: int = 0
    nudge_count: int = 0
    completed: bool = False

    @property
    def focus_score(self) -> float:
        if self.duration_seconds == 0:
            return 0.0
        score = (self.time_focused_seconds / self.duration_seconds) * 100
        if self.nudge_count == 0:
            score += 5
        if self.completed:
            score += 10
        return min(100.0, max(0.0, score))


class FocusSession:
    """Manages a single focus session."""

    def __init__(self, duration_minutes: int = 25, distraction_threshold: float = 10.0):
        self.duration_seconds = duration_minutes * 60
        self.distraction_threshold = distraction_threshold
        self.nudge_cooldown = 30.0

        self.state = SessionState.IDLE
        self.elapsed_seconds = 0
        self.time_focused = 0
        self.time_distracted = 0
        self.nudge_count = 0

        self.distraction_start: Optional[float] = None
        self.last_nudge_time: Optional[float] = None
        self.is_focused = True

    @property
    def remaining_seconds(self) -> int:
        return max(0, self.duration_seconds - self.elapsed_seconds)

    @property
    def remaining_formatted(self) -> str:
        mins, secs = divmod(int(self.remaining_seconds), 60)
        return f"{mins:02d}:{secs:02d}"

    def start(self):
        self.state = SessionState.FOCUSING
        self.elapsed_seconds = 0
        self.time_focused = 0
        self.time_distracted = 0
        self.nudge_count = 0
        self.is_focused = True
        self.distraction_start = None
        self.last_nudge_time = None

    def tick(self, delta: float = 1.0):
        if self.state not in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return

        self.elapsed_seconds += delta
        if self.is_focused:
            self.time_focused += delta
        else:
            self.time_distracted += delta

        if self.elapsed_seconds >= self.duration_seconds:
            self.state = SessionState.COMPLETED

    def update_attention(self, is_focused: bool) -> bool:
        """Update attention state. Returns True if nudge should be triggered."""
        if self.state not in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return False

        current_time = time.time()
        should_nudge = False

        if is_focused:
            if not self.is_focused:
                self.distraction_start = None
                self.is_focused = True
                self.state = SessionState.FOCUSING
        else:
            if self.is_focused:
                self.distraction_start = current_time
                self.is_focused = False
            elif self.distraction_start is not None:
                distraction_duration = current_time - self.distraction_start
                if distraction_duration >= self.distraction_threshold:
                    self.state = SessionState.DISTRACTED
                    should_nudge = self._try_nudge(current_time)

        return should_nudge

    def _try_nudge(self, current_time: float) -> bool:
        if self.last_nudge_time is not None:
            if current_time - self.last_nudge_time < self.nudge_cooldown:
                return False
        self.last_nudge_time = current_time
        self.nudge_count += 1
        return True

    def get_stats(self) -> SessionStats:
        return SessionStats(
            duration_seconds=self.elapsed_seconds,
            time_focused_seconds=self.time_focused,
            time_distracted_seconds=self.time_distracted,
            nudge_count=self.nudge_count,
            completed=self.state == SessionState.COMPLETED,
        )


# =============================================================================
# Robot Animations
# =============================================================================

def focus_mode_enter(reachy: ReachyMini):
    """Alert stance when entering focus mode."""
    head = create_head_pose(z=5, roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, antennas=[0.3, 0.3], duration=0.8, method="minjerk")
    time.sleep(0.3)
    reachy.goto_target(antennas=[0.0, 0.0], duration=0.3)


def focus_mode_exit(reachy: ReachyMini):
    """Relaxed stance when exiting focus mode."""
    head = create_head_pose(z=0, roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, antennas=[0.0, 0.0], body_yaw=0, duration=1.0, method="minjerk")


def idle_breathing(reachy: ReachyMini):
    """Gentle breathing animation during focus."""
    for _ in range(2):
        reachy.goto_target(antennas=[0.1, 0.1], duration=1.5, method="minjerk")
        time.sleep(1.5)
        reachy.goto_target(antennas=[0.0, 0.0], duration=1.5, method="minjerk")
        time.sleep(1.5)


def attention_wiggle(reachy: ReachyMini):
    """Gentle antenna wiggle to get attention."""
    for _ in range(3):
        reachy.goto_target(antennas=[0.4, -0.4], duration=0.15)
        time.sleep(0.15)
        reachy.goto_target(antennas=[-0.4, 0.4], duration=0.15)
        time.sleep(0.15)
    reachy.goto_target(antennas=[0.0, 0.0], duration=0.2)


def disappointed_shake(reachy: ReachyMini, intensity: float = 0.7):
    """Disappointed head shake for persistent distraction."""
    amp = 15 * intensity
    for _ in range(3):
        head = create_head_pose(roll=-amp, mm=True, degrees=True)
        reachy.goto_target(head=head, duration=0.2)
        time.sleep(0.2)
        head = create_head_pose(roll=amp, mm=True, degrees=True)
        reachy.goto_target(head=head, duration=0.2)
        time.sleep(0.2)
    head = create_head_pose(roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, duration=0.3)


def victory_dance(reachy: ReachyMini):
    """Celebration when session completes."""
    # Happy antenna bounce
    for _ in range(5):
        reachy.goto_target(antennas=[0.6, 0.6], duration=0.15)
        time.sleep(0.15)
        reachy.goto_target(antennas=[-0.3, -0.3], duration=0.15)
        time.sleep(0.15)

    # Body sway
    for _ in range(2):
        reachy.goto_target(body_yaw=np.deg2rad(30), duration=0.4)
        time.sleep(0.4)
        reachy.goto_target(body_yaw=np.deg2rad(-30), duration=0.4)
        time.sleep(0.4)

    # Return to neutral
    reachy.goto_target(antennas=[0.0, 0.0], body_yaw=0, duration=0.5)


# =============================================================================
# ReachyMiniApp
# =============================================================================

class FocusGuardianApp(ReachyMiniApp):
    """Focus Guardian - Productivity body-double for Reachy Mini."""

    custom_app_url: str | None = "http://localhost:7862"

    def __init__(self):
        self.session: Optional[FocusSession] = None
        self.is_running = False
        self.simulate_distraction = False
        self.sessions_completed = 0
        self.total_nudges = 0
        self.status_message = "Ready to focus"

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Main loop - called by dashboard."""

        # Start Gradio UI in background
        ui_thread = threading.Thread(
            target=self._run_ui,
            args=(reachy_mini, stop_event),
            daemon=True
        )
        ui_thread.start()

        # Main session loop
        breathing_time = 0
        while not stop_event.is_set():
            if self.is_running and self.session:
                # Tick session timer
                self.session.tick(1.0)

                # Check for completion
                if self.session.state == SessionState.COMPLETED:
                    self.is_running = False
                    self.sessions_completed += 1
                    self.status_message = "Session complete! Great job!"
                    try:
                        victory_dance(reachy_mini)
                    except Exception as e:
                        logger.debug(f"Victory dance error: {e}")

                # Idle breathing every 6 seconds during focus
                elif self.session.state == SessionState.FOCUSING:
                    breathing_time += 1
                    if breathing_time >= 6:
                        breathing_time = 0
                        try:
                            # Simple breath
                            reachy_mini.goto_target(antennas=[0.1, 0.1], duration=1.0)
                        except Exception as e:
                            logger.debug(f"Breathing error: {e}")

            time.sleep(1.0)

        # Cleanup
        if self.is_running:
            self.is_running = False

    def _run_ui(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Run Gradio UI."""

        def start_session(duration, threshold):
            if self.is_running:
                return get_status()

            self.session = FocusSession(
                duration_minutes=int(duration),
                distraction_threshold=float(threshold)
            )
            self.session.start()
            self.is_running = True
            self.status_message = "Focus mode active!"

            try:
                focus_mode_enter(reachy_mini)
            except Exception as e:
                logger.debug(f"Enter animation error: {e}")

            return get_status()

        def stop_session():
            if not self.is_running:
                return get_status()

            self.is_running = False
            self.status_message = "Session ended"

            try:
                focus_mode_exit(reachy_mini)
            except Exception as e:
                logger.debug(f"Exit animation error: {e}")

            return get_status()

        def mark_distracted():
            """Manual distraction trigger for testing."""
            if not self.is_running or not self.session:
                return get_status()

            should_nudge = self.session.update_attention(is_focused=False)
            if should_nudge:
                self.total_nudges += 1
                self.status_message = f"Hey! Focus up! (Nudge #{self.session.nudge_count})"
                try:
                    if self.session.nudge_count <= 1:
                        attention_wiggle(reachy_mini)
                    else:
                        disappointed_shake(reachy_mini, intensity=0.7)
                except Exception as e:
                    logger.debug(f"Nudge animation error: {e}")
            else:
                self.status_message = "Distracted..."

            return get_status()

        def mark_focused():
            """Manual focus trigger."""
            if not self.is_running or not self.session:
                return get_status()

            self.session.update_attention(is_focused=True)
            self.status_message = "Back on track!"
            return get_status()

        def get_status():
            if self.session and self.is_running:
                remaining = self.session.remaining_formatted
                stats = self.session.get_stats()
                score = stats.focus_score
                state = "focusing" if self.session.state == SessionState.FOCUSING else "distracted"
            else:
                remaining = "25:00"
                score = 0
                state = "idle"

            state_colors = {
                "focusing": "#4CAF50",
                "distracted": "#FF9800",
                "idle": "#666"
            }

            return f"""
            <div style="text-align:center; padding:30px;">
                <div style="font-size:72px; font-weight:bold; color:{state_colors.get(state, '#666')};
                            font-family:monospace; margin-bottom:10px;">
                    {remaining}
                </div>
                <div style="font-size:20px; color:#666; margin-bottom:20px;">
                    {self.status_message}
                </div>
                <div style="display:flex; justify-content:center; gap:40px;">
                    <div style="text-align:center;">
                        <div style="font-size:36px; font-weight:bold; color:#4CAF50;">
                            {self.sessions_completed}
                        </div>
                        <div style="font-size:14px; color:#666;">Sessions</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:36px; font-weight:bold; color:#2196F3;">
                            {score:.0f}%
                        </div>
                        <div style="font-size:14px; color:#666;">Focus</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:36px; font-weight:bold; color:#FF9800;">
                            {self.total_nudges}
                        </div>
                        <div style="font-size:14px; color:#666;">Nudges</div>
                    </div>
                </div>
            </div>
            """

        with gr.Blocks(title="Focus Guardian") as demo:
            gr.HTML("""
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 25px; border-radius: 15px; text-align: center;">
                <h1 style="margin: 0;">Focus Guardian</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Your productivity body-double</p>
            </div>
            """)

            status_html = gr.HTML(value=get_status())

            with gr.Row():
                with gr.Column():
                    duration_slider = gr.Slider(5, 60, value=25, step=5, label="Session (minutes)")
                    threshold_slider = gr.Slider(5, 30, value=10, step=5, label="Distraction threshold (seconds)")

                with gr.Column():
                    with gr.Row():
                        start_btn = gr.Button("Start Focus Session", variant="primary", size="lg")
                        stop_btn = gr.Button("End Session", variant="secondary", size="lg")

            gr.Markdown("### Manual Attention Control")
            gr.Markdown("*Use these to simulate attention changes (camera tracking coming soon)*")

            with gr.Row():
                distracted_btn = gr.Button("I'm Distracted", variant="stop")
                focused_btn = gr.Button("I'm Focused", variant="primary")

            timer = gr.Timer(value=1)
            timer.tick(fn=get_status, outputs=[status_html])

            start_btn.click(fn=start_session, inputs=[duration_slider, threshold_slider], outputs=[status_html])
            stop_btn.click(fn=stop_session, outputs=[status_html])
            distracted_btn.click(fn=mark_distracted, outputs=[status_html])
            focused_btn.click(fn=mark_focused, outputs=[status_html])

        demo.launch(server_port=7862, quiet=True, prevent_thread_lock=True)

        while not stop_event.is_set():
            time.sleep(1)


if __name__ == "__main__":
    print("Focus Guardian - Run via Reachy Mini dashboard")
    print("Install: pip install -e .")
