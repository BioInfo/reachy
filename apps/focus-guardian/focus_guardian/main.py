"""
Focus Guardian - Productivity Body-Double for Reachy Mini

A physical productivity companion that monitors your attention using
the robot's camera and provides real-time feedback through expressive
robot movements.
"""

import time
import threading
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional

import cv2
import numpy as np
import gradio as gr

from reachy_mini import ReachyMini, ReachyMiniApp
from reachy_mini.utils import create_head_pose

logger = logging.getLogger(__name__)


# =============================================================================
# Gaze Detection (MediaPipe)
# =============================================================================

class GazeDirection(Enum):
    """Detected gaze direction."""
    MONITOR = "monitor"
    AWAY_LEFT = "away_left"
    AWAY_RIGHT = "away_right"
    DOWN = "down"
    UP = "up"
    UNKNOWN = "unknown"


@dataclass
class GazeResult:
    """Result from gaze detection."""
    direction: GazeDirection
    face_detected: bool
    confidence: float
    yaw: float = 0.0
    pitch: float = 0.0


class RobotPosition(Enum):
    """Where the robot sits relative to user and screen."""
    LEFT = "left"      # Robot to user's left, user looks right at screen
    CENTER = "center"  # Robot in front (on monitor/desk center)
    RIGHT = "right"    # Robot to user's right, user looks left at screen


class GazeDetector:
    """Presence detection using motion detection.

    Detects if user is actively at desk by looking for motion.
    Motion = user present and working. Static frame = user gone.
    Works regardless of camera angle or background clutter.
    """

    def __init__(
        self,
        yaw_threshold: float = 25.0,
        pitch_threshold: float = 20.0,
        down_threshold: float = 30.0,
    ):
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
        self.down_threshold = down_threshold
        self.robot_position = RobotPosition.CENTER
        self._initialized = False
        self._prev_frame = None
        self._motion_history = []  # Track recent motion levels
        self._consecutive_still = 0

    def set_robot_position(self, position: RobotPosition):
        """Set where the robot is positioned relative to the user."""
        self.robot_position = position

    def initialize(self):
        """Initialize motion detector."""
        if self._initialized:
            return True
        self._initialized = True
        logger.info("Motion detector initialized")
        return True

    def detect(self, frame: np.ndarray) -> GazeResult:
        """Detect if user is present via motion detection."""
        if not self._initialized:
            self.initialize()

        try:
            # Only analyze left 40% of frame (where user sits, ignore monitors)
            h, w = frame.shape[:2]
            roi = frame[:, :int(w * 0.4)]

            # Convert to grayscale and blur for motion detection
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)

            # First frame - no comparison yet
            if self._prev_frame is None:
                self._prev_frame = gray
                return GazeResult(GazeDirection.MONITOR, True, 0.5)

            # Calculate frame difference
            frame_diff = cv2.absdiff(self._prev_frame, gray)
            thresh = cv2.threshold(frame_diff, 30, 255, cv2.THRESH_BINARY)[1]

            # Calculate motion score (percentage of pixels that changed)
            motion_score = np.sum(thresh > 0) / thresh.size

            # Update previous frame
            self._prev_frame = gray

            # Track motion history (last 10 readings = ~5 seconds)
            self._motion_history.append(motion_score)
            if len(self._motion_history) > 10:
                self._motion_history.pop(0)

            # Average recent motion
            avg_motion = sum(self._motion_history) / len(self._motion_history)


            # Lower threshold - detect subtle typing/mouse movements
            # User movement is typically 0.005-0.10, empty room <0.002
            MOTION_THRESHOLD = 0.003

            if avg_motion > MOTION_THRESHOLD:
                self._consecutive_still = 0
                return GazeResult(
                    direction=GazeDirection.MONITOR,
                    face_detected=True,
                    confidence=min(avg_motion * 20, 1.0),
                    yaw=0,
                    pitch=0
                )
            else:
                self._consecutive_still += 1

                # Longer grace period - ~10 seconds of stillness allowed
                if self._consecutive_still < 20:
                    return GazeResult(GazeDirection.MONITOR, False, 0.3)

                # User gone or very still for too long
                return GazeResult(GazeDirection.UNKNOWN, False, 0.0)

        except Exception as e:
            logger.debug(f"Motion detection error: {e}")
            return GazeResult(GazeDirection.UNKNOWN, False, 0.0)

    def release(self):
        """Release resources."""
        self._prev_frame = None
        self._motion_history = []
        self._initialized = False


# =============================================================================
# Session State
# =============================================================================

class SessionState(Enum):
    IDLE = "idle"
    FOCUSING = "focusing"
    DISTRACTED = "distracted"
    COMPLETED = "completed"


class RobotState(Enum):
    IDLE = "idle"
    ENTERING = "entering"
    WATCHING = "watching"
    BREATHING = "breathing"
    NUDGING = "nudging"
    DISAPPOINTED = "disappointed"
    CELEBRATING = "celebrating"
    EXITING = "exiting"


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

    def __init__(self, duration_minutes: int = 25):
        self.duration_seconds = duration_minutes * 60
        self.distraction_threshold = 5.0  # seconds before nudge (reduced for camera)
        self.nudge_cooldown = 20.0  # seconds between nudges

        self.state = SessionState.IDLE
        self.elapsed_seconds = 0
        self.time_focused = 0
        self.time_distracted = 0
        self.nudge_count = 0

        self.distraction_start: Optional[float] = None
        self.last_nudge_time: Optional[float] = None

    @property
    def remaining_seconds(self) -> int:
        return max(0, self.duration_seconds - self.elapsed_seconds)

    @property
    def remaining_formatted(self) -> str:
        mins, secs = divmod(int(self.remaining_seconds), 60)
        return f"{mins:02d}:{secs:02d}"

    @property
    def progress(self) -> float:
        if self.duration_seconds == 0:
            return 0.0
        return min(1.0, self.elapsed_seconds / self.duration_seconds)

    def start(self):
        self.state = SessionState.FOCUSING
        self.elapsed_seconds = 0
        self.time_focused = 0
        self.time_distracted = 0
        self.nudge_count = 0
        self.distraction_start = None
        self.last_nudge_time = None

    def tick(self, delta: float, is_focused: bool) -> bool:
        """
        Update session state. Returns True if nudge should be triggered.
        """
        if self.state not in (SessionState.FOCUSING, SessionState.DISTRACTED):
            return False

        self.elapsed_seconds += delta

        if is_focused:
            self.time_focused += delta
            self.distraction_start = None
            self.state = SessionState.FOCUSING
        else:
            self.time_distracted += delta
            if self.distraction_start is None:
                self.distraction_start = time.time()

        # Check for completion
        if self.elapsed_seconds >= self.duration_seconds:
            self.state = SessionState.COMPLETED
            return False

        # Check for nudge trigger
        if not is_focused and self.distraction_start:
            distraction_duration = time.time() - self.distraction_start
            if distraction_duration >= self.distraction_threshold:
                self.state = SessionState.DISTRACTED
                return self._try_nudge()

        return False

    def _try_nudge(self) -> bool:
        current_time = time.time()
        if self.last_nudge_time is not None:
            if current_time - self.last_nudge_time < self.nudge_cooldown:
                return False
        self.last_nudge_time = current_time
        self.nudge_count += 1
        self.distraction_start = None  # Reset after nudge
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

def play_sound_safe(reachy: ReachyMini, sound_name: str):
    """Play a sound, catching any errors."""
    try:
        reachy.media.play_sound(sound_name)
    except Exception as e:
        logger.debug(f"Sound playback error: {e}")


def focus_mode_enter(reachy: ReachyMini):
    """Alert stance when entering focus mode."""
    head = create_head_pose(z=8, roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, antennas=[0.5, 0.5], duration=0.6, method="minjerk")
    time.sleep(0.4)
    reachy.goto_target(antennas=[0.2, 0.2], duration=0.4, method="minjerk")


def focus_mode_exit(reachy: ReachyMini):
    """Relaxed stance when exiting focus mode."""
    head = create_head_pose(z=0, roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, antennas=[0.0, 0.0], body_yaw=0, duration=1.0, method="minjerk")


def breathing_animation(reachy: ReachyMini):
    """Visible breathing - antenna rise and fall."""
    reachy.goto_target(antennas=[0.3, 0.3], duration=1.2, method="minjerk")
    time.sleep(1.2)
    reachy.goto_target(antennas=[0.1, 0.1], duration=1.2, method="minjerk")
    time.sleep(1.2)


def attention_wiggle(reachy: ReachyMini):
    """Quick antenna wiggle to get attention."""
    for _ in range(4):
        reachy.goto_target(antennas=[0.5, -0.3], duration=0.12)
        time.sleep(0.12)
        reachy.goto_target(antennas=[-0.3, 0.5], duration=0.12)
        time.sleep(0.12)
    reachy.goto_target(antennas=[0.2, 0.2], duration=0.3)


def disappointed_shake(reachy: ReachyMini):
    """Disappointed head shake."""
    for _ in range(3):
        head = create_head_pose(roll=-18, mm=True, degrees=True)
        reachy.goto_target(head=head, antennas=[-0.2, -0.2], duration=0.18)
        time.sleep(0.18)
        head = create_head_pose(roll=18, mm=True, degrees=True)
        reachy.goto_target(head=head, antennas=[-0.2, -0.2], duration=0.18)
        time.sleep(0.18)
    head = create_head_pose(roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, antennas=[0.0, 0.0], duration=0.3)
    time.sleep(0.5)
    reachy.goto_target(antennas=[0.2, 0.2], duration=0.3)


def victory_dance(reachy: ReachyMini):
    """Celebration when session completes!"""
    for _ in range(6):
        reachy.goto_target(antennas=[0.7, 0.7], duration=0.12)
        time.sleep(0.12)
        reachy.goto_target(antennas=[0.0, 0.0], duration=0.12)
        time.sleep(0.12)

    for _ in range(2):
        head = create_head_pose(z=5, roll=10, mm=True, degrees=True)
        reachy.goto_target(head=head, body_yaw=np.deg2rad(25), antennas=[0.4, 0.6], duration=0.35)
        time.sleep(0.35)
        head = create_head_pose(z=5, roll=-10, mm=True, degrees=True)
        reachy.goto_target(head=head, body_yaw=np.deg2rad(-25), antennas=[0.6, 0.4], duration=0.35)
        time.sleep(0.35)

    head = create_head_pose(z=5, roll=0, mm=True, degrees=True)
    reachy.goto_target(head=head, antennas=[0.3, 0.3], body_yaw=0, duration=0.4)


# =============================================================================
# UI Templates
# =============================================================================

COLORS = {
    "green": "#22c55e",
    "orange": "#f97316",
    "red": "#ef4444",
    "blue": "#3b82f6",
    "gray": "#6b7280",
    "dark": "#1f2937",
    "light": "#f3f4f6",
}

ROBOT_MESSAGES = {
    RobotState.IDLE: ("Ready when you are", "Standing by"),
    RobotState.ENTERING: ("Let's focus!", "Getting ready..."),
    RobotState.WATCHING: ("Watching you", "Camera active"),
    RobotState.BREATHING: ("With you", "Breathing gently"),
    RobotState.NUDGING: ("Hey! Focus up!", "Getting your attention"),
    RobotState.DISAPPOINTED: ("Come on, you got this!", "Shaking head"),
    RobotState.CELEBRATING: ("You did it!", "Celebrating!"),
    RobotState.EXITING: ("Good session!", "Relaxing"),
}

GAZE_LABELS = {
    GazeDirection.MONITOR: ("At desk", COLORS["green"]),
    GazeDirection.DOWN: ("At desk", COLORS["green"]),
    GazeDirection.AWAY_LEFT: ("At desk", COLORS["green"]),
    GazeDirection.AWAY_RIGHT: ("At desk", COLORS["green"]),
    GazeDirection.UP: ("At desk", COLORS["green"]),
    GazeDirection.UNKNOWN: ("Away from desk", COLORS["orange"]),
}


def build_status_html(
    remaining: str,
    progress: float,
    session_state: SessionState,
    robot_state: RobotState,
    gaze: GazeResult,
    stats: SessionStats,
    sessions_completed: int,
    total_nudges: int,
    camera_enabled: bool,
) -> str:
    """Build the main status display HTML."""

    # State colors
    if session_state == SessionState.FOCUSING:
        timer_color = COLORS["green"]
        state_text = "Focusing"
    elif session_state == SessionState.DISTRACTED:
        timer_color = COLORS["orange"]
        state_text = "Distracted"
    elif session_state == SessionState.COMPLETED:
        timer_color = COLORS["blue"]
        state_text = "Complete!"
    else:
        timer_color = COLORS["gray"]
        state_text = "Ready"

    # Robot message
    robot_msg = ROBOT_MESSAGES.get(robot_state, ("", ""))
    robot_action = robot_msg[0]
    robot_detail = robot_msg[1]

    # Presence status
    gaze_label, gaze_color = GAZE_LABELS.get(gaze.direction, ("Unknown", COLORS["gray"]))
    if not camera_enabled:
        gaze_html = '<span style="color: #9ca3af;">Camera off - manual mode</span>'
    elif gaze.face_detected or gaze.direction == GazeDirection.MONITOR:
        # Detected or in grace period
        gaze_html = f'<span style="color: {gaze_color}; font-weight: 600;">{gaze_label}</span>'
    else:
        gaze_html = f'<span style="color: {gaze_color};">{gaze_label}</span>'

    # Progress bar
    progress_pct = int(progress * 100)

    # Focus score
    score = stats.focus_score if stats.duration_seconds > 0 else 0

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Timer Section -->
        <div style="text-align: center; padding: 30px 20px 20px 20px;">
            <div style="font-size: 64px; font-weight: 700; color: {timer_color};
                        font-family: 'SF Mono', Monaco, monospace; letter-spacing: -2px;">
                {remaining}
            </div>
            <div style="font-size: 14px; color: {COLORS['gray']}; text-transform: uppercase;
                        letter-spacing: 2px; margin-top: 5px;">
                {state_text}
            </div>

            <!-- Progress Bar -->
            <div style="margin: 20px auto; max-width: 300px;">
                <div style="background: {COLORS['light']}; border-radius: 10px; height: 8px; overflow: hidden;">
                    <div style="background: {timer_color}; height: 100%; width: {progress_pct}%;
                                transition: width 0.5s ease;"></div>
                </div>
            </div>
        </div>

        <!-- Gaze Status -->
        <div style="text-align: center; padding: 10px; margin: 0 10px;">
            <div style="font-size: 13px;">
                {gaze_html}
            </div>
        </div>

        <!-- Robot Status -->
        <div style="background: {COLORS['light']}; border-radius: 12px; padding: 16px 20px;
                    margin: 10px 10px 20px 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 28px;">🤖</div>
                <div>
                    <div style="font-size: 16px; font-weight: 600; color: {COLORS['dark']};">
                        {robot_action}
                    </div>
                    <div style="font-size: 13px; color: {COLORS['gray']};">
                        {robot_detail}
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Row -->
        <div style="display: flex; justify-content: space-around; padding: 15px 10px;
                    border-top: 1px solid {COLORS['light']};">
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: {COLORS['green']};">
                    {sessions_completed}
                </div>
                <div style="font-size: 11px; color: {COLORS['gray']}; text-transform: uppercase;">
                    Sessions
                </div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: {COLORS['blue']};">
                    {score:.0f}%
                </div>
                <div style="font-size: 11px; color: {COLORS['gray']}; text-transform: uppercase;">
                    Focus
                </div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: {COLORS['orange']};">
                    {total_nudges}
                </div>
                <div style="font-size: 11px; color: {COLORS['gray']}; text-transform: uppercase;">
                    Nudges
                </div>
            </div>
        </div>
    </div>
    """


# =============================================================================
# Main App
# =============================================================================

class ReachyMiniFocusGuardian(ReachyMiniApp):
    """Focus Guardian - Productivity body-double for Reachy Mini."""

    custom_app_url: str | None = "http://localhost:7862"
    dont_start_webserver: bool = True
    request_media_backend: str | None = "default"  # Request camera access

    def __init__(self):
        super().__init__()
        self.session: Optional[FocusSession] = None
        self.is_running = False
        self.sessions_completed = 0
        self.total_nudges = 0

        # Robot state
        self.robot_state = RobotState.IDLE
        self._animation_lock = threading.Lock()

        # Camera/gaze tracking
        self.camera_enabled = True
        self.gaze_detector = GazeDetector()
        self.current_gaze = GazeResult(GazeDirection.UNKNOWN, False, 0.0)
        self._gaze_lock = threading.Lock()

    def _set_robot_state(self, state: RobotState):
        with self._animation_lock:
            self.robot_state = state

    def _set_gaze(self, gaze: GazeResult):
        with self._gaze_lock:
            self.current_gaze = gaze

    def _get_gaze(self) -> GazeResult:
        with self._gaze_lock:
            return self.current_gaze

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Main loop - called by dashboard."""

        # Start Gradio UI in background
        ui_thread = threading.Thread(
            target=self._run_ui,
            args=(reachy_mini, stop_event),
            daemon=True
        )
        ui_thread.start()

        # Initialize gaze detector
        if self.camera_enabled:
            self.gaze_detector.initialize()

        # Timing
        breath_counter = 0
        BREATH_INTERVAL = 6
        last_tick = time.time()

        while not stop_event.is_set():
            current_time = time.time()
            delta = current_time - last_tick
            last_tick = current_time

            # Get camera frame and detect gaze
            is_focused = True
            if self.camera_enabled and self.is_running:
                try:
                    frame = reachy_mini.media.get_frame()
                    if frame is not None:
                        # Save one frame for debugging
                        import os
                        if not os.path.exists("/tmp/focus-guardian-frame.jpg"):
                            cv2.imwrite("/tmp/focus-guardian-frame.jpg", frame)

                        gaze = self.gaze_detector.detect(frame)
                        self._set_gaze(gaze)
                        is_focused = gaze.direction == GazeDirection.MONITOR
                except Exception as e:
                    logger.debug(f"Camera error: {e}")

            if self.is_running and self.session:
                # Update session with attention state
                should_nudge = self.session.tick(delta, is_focused)

                # Handle completion
                if self.session.state == SessionState.COMPLETED:
                    self.is_running = False
                    self.sessions_completed += 1
                    self._set_robot_state(RobotState.CELEBRATING)
                    try:
                        play_sound_safe(reachy_mini, "dance1.wav")
                        victory_dance(reachy_mini)
                    except Exception as e:
                        logger.debug(f"Victory dance error: {e}")
                    self._set_robot_state(RobotState.IDLE)

                # Handle nudge
                elif should_nudge:
                    self.total_nudges += 1
                    try:
                        if self.session.nudge_count <= 1:
                            self._set_robot_state(RobotState.NUDGING)
                            play_sound_safe(reachy_mini, "impatient1.wav")
                            attention_wiggle(reachy_mini)
                        else:
                            self._set_robot_state(RobotState.DISAPPOINTED)
                            play_sound_safe(reachy_mini, "confused1.wav")
                            disappointed_shake(reachy_mini)
                    except Exception as e:
                        logger.debug(f"Nudge error: {e}")
                    self._set_robot_state(RobotState.WATCHING)

                # Breathing during focus
                elif self.session.state == SessionState.FOCUSING:
                    breath_counter += delta
                    if breath_counter >= BREATH_INTERVAL:
                        breath_counter = 0
                        if self.robot_state == RobotState.WATCHING:
                            self._set_robot_state(RobotState.BREATHING)
                            try:
                                breathing_animation(reachy_mini)
                            except Exception as e:
                                logger.debug(f"Breathing error: {e}")
                            self._set_robot_state(RobotState.WATCHING)

            time.sleep(0.5)  # 2 Hz loop for camera

        # Cleanup
        self.gaze_detector.release()
        if self.is_running:
            self.is_running = False
            self._set_robot_state(RobotState.IDLE)

    def _run_ui(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """Run Gradio UI."""

        def start_session(duration, use_camera, robot_pos):
            if self.is_running:
                return get_status()

            self.camera_enabled = use_camera

            # Set robot position for gaze detection
            pos_map = {
                "Left of me": RobotPosition.LEFT,
                "In front (center)": RobotPosition.CENTER,
                "Right of me": RobotPosition.RIGHT,
            }
            self.gaze_detector.set_robot_position(pos_map.get(robot_pos, RobotPosition.CENTER))

            self.session = FocusSession(duration_minutes=int(duration))
            self.session.start()
            self.is_running = True

            self._set_robot_state(RobotState.ENTERING)
            try:
                play_sound_safe(reachy_mini, "wake_up.wav")
                focus_mode_enter(reachy_mini)
            except Exception as e:
                logger.debug(f"Enter animation error: {e}")
            self._set_robot_state(RobotState.WATCHING)

            return get_status()

        def stop_session():
            if not self.is_running:
                return get_status()

            self.is_running = False
            self._set_robot_state(RobotState.EXITING)

            try:
                play_sound_safe(reachy_mini, "go_sleep.wav")
                focus_mode_exit(reachy_mini)
            except Exception as e:
                logger.debug(f"Exit animation error: {e}")

            self._set_robot_state(RobotState.IDLE)
            return get_status()

        def mark_distracted():
            """Manual distraction trigger."""
            if not self.is_running or not self.session:
                return get_status()

            self.session.nudge_count += 1
            self.total_nudges += 1

            try:
                if self.session.nudge_count <= 1:
                    self._set_robot_state(RobotState.NUDGING)
                    play_sound_safe(reachy_mini, "impatient1.wav")
                    attention_wiggle(reachy_mini)
                else:
                    self._set_robot_state(RobotState.DISAPPOINTED)
                    play_sound_safe(reachy_mini, "confused1.wav")
                    disappointed_shake(reachy_mini)
            except Exception as e:
                logger.debug(f"Nudge animation error: {e}")
            self._set_robot_state(RobotState.WATCHING)

            return get_status()

        def mark_focused():
            """Manual focus trigger."""
            if not self.is_running or not self.session:
                return get_status()
            self._set_robot_state(RobotState.WATCHING)
            return get_status()

        def get_status():
            if self.session and self.is_running:
                remaining = self.session.remaining_formatted
                progress = self.session.progress
                session_state = self.session.state
                stats = self.session.get_stats()
            else:
                remaining = "--:--"
                progress = 0.0
                session_state = SessionState.IDLE
                stats = SessionStats()

            return build_status_html(
                remaining=remaining,
                progress=progress,
                session_state=session_state,
                robot_state=self.robot_state,
                gaze=self._get_gaze(),
                stats=stats,
                sessions_completed=self.sessions_completed,
                total_nudges=self.total_nudges,
                camera_enabled=self.camera_enabled,
            )

        # Build UI
        with gr.Blocks(
            title="Focus Guardian",
            css="""
                .gradio-container { max-width: 480px !important; margin: auto; }
                footer { display: none !important; }
            """
        ) as demo:

            gr.HTML("""
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        color: white; padding: 20px; text-align: center;
                        border-radius: 12px; margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Focus Guardian</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                    Your productivity body-double
                </p>
            </div>
            """)

            status_html = gr.HTML(value=get_status())

            with gr.Group():
                duration_slider = gr.Slider(
                    minimum=5, maximum=60, value=25, step=5,
                    label="Session Duration (minutes)"
                )

                with gr.Row():
                    camera_toggle = gr.Checkbox(
                        value=True,
                        label="Use camera",
                        info="Track attention via camera"
                    )
                    robot_position = gr.Dropdown(
                        choices=["Left of me", "In front (center)", "Right of me"],
                        value="Right of me",
                        label="Robot position",
                        info="Where is the robot relative to you?"
                    )

                with gr.Row():
                    start_btn = gr.Button(
                        "Start Focus Session",
                        variant="primary",
                        size="lg",
                        scale=2
                    )
                    stop_btn = gr.Button(
                        "Stop",
                        variant="secondary",
                        size="lg",
                        scale=1
                    )

            # Manual controls (shown when camera is off or for testing)
            gr.HTML("""
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;
                            letter-spacing: 1px; margin-bottom: 10px;">
                    Manual Controls
                </div>
            </div>
            """)

            with gr.Row():
                distracted_btn = gr.Button("Trigger Nudge", size="sm")
                focused_btn = gr.Button("Mark Focused", size="sm")

            # Auto-refresh
            timer = gr.Timer(value=0.5)
            timer.tick(fn=get_status, outputs=[status_html])

            # Handlers
            start_btn.click(fn=start_session, inputs=[duration_slider, camera_toggle, robot_position], outputs=[status_html])
            stop_btn.click(fn=stop_session, outputs=[status_html])
            distracted_btn.click(fn=mark_distracted, outputs=[status_html])
            focused_btn.click(fn=mark_focused, outputs=[status_html])

        demo.launch(server_port=7862, quiet=True, prevent_thread_lock=True)

        while not stop_event.is_set():
            time.sleep(1)


if __name__ == "__main__":
    app = ReachyMiniFocusGuardian()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()
