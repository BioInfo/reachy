"""Focus Guardian v2 orchestrator — thin wiring over shared building blocks.

Composes: shared attention `Detector` + `FocusSession` (logic) + shared
`EmotionFeedback` (reactions) + shared `AppServer` (UI/API/WS) + `FocusHistory`
(persistence). The orchestrator owns the control loop and the robot; everything
else is a reusable part.

Concurrency model:
- The control loop runs in `run()` (the thread the daemon gives us). It is the
  ONLY place that touches the robot, so motion is serialized.
- The server runs in a background thread. Commands (start/stop/config) just
  enqueue an intent; the loop drains intents at the top of each tick and does
  any robot work there. State is snapshotted under a lock for the WS/REST reads.
"""

from __future__ import annotations

import logging
import threading
import time
from pathlib import Path
from typing import Any, Optional

from reachy_mini import ReachyMini, ReachyMiniApp

from ._bootstrap import ensure_shared_importable

ensure_shared_importable()

from shared.vision import build_detector  # noqa: E402
from shared.app.server import AppServer  # noqa: E402

from .config import FocusConfig  # noqa: E402
from .session import FocusSession, SessionState, SessionEvent  # noqa: E402
from .persistence import FocusHistory  # noqa: E402
from .feedback import build_focus_feedback, ENTER, EXIT, BREATHE  # noqa: E402

logger = logging.getLogger(__name__)

_WEB_DIR = Path(__file__).resolve().parent / "web"


class ReachyMiniFocusGuardian(ReachyMiniApp):
    """Productivity body-double for Reachy Mini (v2)."""

    custom_app_url: str | None = None  # set from config port at construction
    dont_start_webserver: bool = True
    request_media_backend: str | None = "default"  # camera access

    def __init__(self, config: Optional[FocusConfig] = None):
        super().__init__()
        self.cfg = config or FocusConfig.from_env()
        self.custom_app_url = f"http://localhost:{self.cfg.ui_port}"

        self.session = FocusSession(
            duration_minutes=self.cfg.duration_minutes,
            break_minutes=self.cfg.break_minutes,
            distraction_grace_s=self.cfg.distraction_grace_s,
            nudge_cooldown_s=self.cfg.nudge_cooldown_s,
        )
        self.detector = build_detector(self.cfg.detector_spec())
        self.feedback = build_focus_feedback(sound=self.cfg.sound_enabled)
        self.history = FocusHistory(self.cfg.history_path)

        self._lock = threading.Lock()
        self._intents: list[tuple[str, dict[str, Any]]] = []
        self._robot_label = "idle"
        self._last_attention = None  # last AttentionResult
        self._breathe_accum = 0.0
        self.sessions_completed = 0
        self.total_nudges = 0

        self.server = AppServer(
            self.cfg.app_name, self._snapshot,
            web_dir=_WEB_DIR, host="127.0.0.1", port=self.cfg.ui_port,
            push_interval_s=self.cfg.tick_interval_s,
        )
        self.server.register_command("start", self._cmd_start)
        self.server.register_command("stop", self._cmd_stop)
        self.server.register_command("config", self._cmd_config)
        self.server.register_command("nudge", self._cmd_test_nudge)

    # -- commands (run in server thread; only enqueue) ---------------------

    def _cmd_start(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("start", body or {}))
        return {"queued": "start"}

    def _cmd_stop(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("stop", {}))
        return {"queued": "stop"}

    def _cmd_config(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.cfg.apply_overrides(**(body or {}))
        return self.cfg.public_dict()

    def _cmd_test_nudge(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("test_nudge", {}))
        return {"queued": "nudge"}

    # -- snapshot for UI ---------------------------------------------------

    def _snapshot(self) -> dict[str, Any]:
        with self._lock:
            s = self.session
            att = self._last_attention
            return {
                "state": s.state.value,
                "active": s.active,
                "remaining": s.remaining_formatted,
                "remaining_s": round(s.remaining_s, 1),
                "progress": round(s.progress, 3),
                "stats": {
                    "elapsed_s": round(s.elapsed_s, 1),
                    "focused_s": round(s.focused_s, 1),
                    "distracted_s": round(s.distracted_s, 1),
                    "nudges": s.nudge_count,
                    "focus_score": s.stats().focus_score,
                },
                "robot": self._robot_label,
                "attention": None if att is None else {
                    "present": att.present, "engaged": att.engaged,
                    "focused": att.focused, "source": att.source,
                    "detail": att.detail,
                },
                "totals": self.history.totals(),
                "config": self.cfg.public_dict(),
            }

    # -- control loop ------------------------------------------------------

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        self.server.start_in_thread()
        self.detector.reset()
        last = time.monotonic()

        while not stop_event.is_set():
            now = time.monotonic()
            delta = now - last
            last = now

            self._drain_intents(reachy_mini)

            focused = self._read_attention(reachy_mini)

            if self.session.active and self.session.state != SessionState.BREAK:
                events = self.session.tick(delta, focused)
                self._handle_events(reachy_mini, events)
                self._maybe_breathe(reachy_mini, delta, focused)
            elif self.session.state == SessionState.BREAK:
                events = self.session.tick(delta, focused)
                self._handle_events(reachy_mini, events)

            time.sleep(self.cfg.tick_interval_s)

        self._safe_feedback(reachy_mini, EXIT)
        self.detector.release()
        self.server.stop()

    def _drain_intents(self, robot: ReachyMini) -> None:
        with self._lock:
            intents, self._intents = self._intents, []
        for name, body in intents:
            if name == "start":
                with self._lock:
                    self.cfg.apply_overrides(**body)
                    self.session.duration_s = self.cfg.duration_minutes * 60
                    self.session.break_s = self.cfg.break_minutes * 60
                    self.session.distraction_grace_s = self.cfg.distraction_grace_s
                    self.session.nudge_cooldown_s = self.cfg.nudge_cooldown_s
                    self.session.start()
                    self._breathe_accum = 0.0
                self.detector.reset()
                self._safe_feedback(robot, ENTER)
            elif name == "stop":
                with self._lock:
                    self.session.stop()
                self._safe_feedback(robot, EXIT)
            elif name == "test_nudge":
                self._safe_feedback(robot, "nudge")

    def _read_attention(self, robot: ReachyMini) -> bool:
        if not (self.cfg.camera_enabled and self.session.active):
            return True
        try:
            frame = robot.media.get_frame()
            if frame is None:
                return True
            att = self.detector.detect(frame)
            with self._lock:
                self._last_attention = att
            return att.focused
        except Exception as e:  # noqa: BLE001
            logger.debug("attention read error: %s", e)
            return True

    def _handle_events(self, robot: ReachyMini, events: list[SessionEvent]) -> None:
        for ev in events:
            if ev == SessionEvent.NUDGE:
                with self._lock:
                    self.total_nudges += 1
                self._safe_feedback(robot, "nudge")
            elif ev == SessionEvent.ESCALATE:
                with self._lock:
                    self.total_nudges += 1
                self._safe_feedback(robot, "escalate")
            elif ev == SessionEvent.COMPLETED:
                with self._lock:
                    self.sessions_completed += 1
                self._safe_feedback(robot, "completed")
                self._record_completion(completed=True)
            elif ev == SessionEvent.BREAK_STARTED:
                self._safe_feedback(robot, "break_started")
            elif ev == SessionEvent.BREAK_ENDED:
                self._safe_feedback(robot, "break_ended")

    def _maybe_breathe(self, robot: ReachyMini, delta: float, focused: bool) -> None:
        if self.session.state != SessionState.FOCUSING or not focused:
            self._breathe_accum = 0.0
            return
        self._breathe_accum += delta
        if self._breathe_accum >= self.cfg.breathe_interval_s:
            self._breathe_accum = 0.0
            self._safe_feedback(robot, BREATHE)

    def _record_completion(self, *, completed: bool) -> None:
        with self._lock:
            stats = self.session.stats()
            dur = self.cfg.duration_minutes
        self.history.record(stats, duration_minutes=dur, completed=completed)

    def _safe_feedback(self, robot: ReachyMini, event: str) -> None:
        try:
            label = self.feedback.play(robot, event)
        except Exception as e:  # noqa: BLE001
            logger.debug("feedback %s error: %s", event, e)
            label = f"err:{event}"
        with self._lock:
            self._robot_label = label


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    app = ReachyMiniFocusGuardian()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()


if __name__ == "__main__":
    main()
