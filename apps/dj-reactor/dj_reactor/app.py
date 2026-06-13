"""DJ Reactor v2 orchestrator — thin wiring over shared building blocks.

Composes: shared `AudioSource` (capture+analysis) + `DanceController` (audio→motion)
+ `DJSession` (set logic) + `EmotionFeedback`/`DropDancer` (discrete reactions) +
shared `AppServer` (UI/API/WS) + `DJHistory` (persistence). The orchestrator owns
the control loop and the robot; everything else is a reusable part.

Concurrency model (same as Focus Guardian):
- The control loop runs in `run()` — the ONLY place that touches the robot, so
  motion is serialized.
- The server runs in a background thread. Commands enqueue an intent; the loop
  drains intents at the top of each tick (and does device/robot work there).
  State is snapshotted under a lock for WS/REST reads.

Two kinds of motion: the continuous beat-driven groove (DanceController → goto)
runs every frame while music plays; discrete reactions (start/pause/drop/end) play
emotion/dance-library moves that briefly take over.
"""

from __future__ import annotations

import logging
import threading
import time
from pathlib import Path
from typing import Any, Optional

import numpy as np
from reachy_mini import ReachyMini, ReachyMiniApp
from reachy_mini.utils import create_head_pose

from ._bootstrap import ensure_shared_importable

ensure_shared_importable()

from shared.audio import build_audio_source, list_input_devices  # noqa: E402
from shared.reachy_utils import safe_goto  # noqa: E402
from shared.app.server import AppServer  # noqa: E402

from .config import DJConfig  # noqa: E402
from .genres import get_preset, genre_choices  # noqa: E402
from .dance import DanceController  # noqa: E402
from .session import DJSession, DJState, DJEvent  # noqa: E402
from .persistence import DJHistory  # noqa: E402
from .feedback import build_dj_feedback, DropDancer, ENTER, EXIT  # noqa: E402

logger = logging.getLogger(__name__)

_WEB_DIR = Path(__file__).resolve().parent / "web"


class ReachyMiniDjReactor(ReachyMiniApp):
    """Music visualizer / dance companion for Reachy Mini (v2)."""

    custom_app_url: str | None = None  # set from config port at construction
    dont_start_webserver: bool = True
    request_media_backend: str | None = "no_media"  # DJ dances to audio, no camera

    def __init__(self, config: Optional[DJConfig] = None):
        super().__init__()
        self.cfg = config or DJConfig.from_env()
        self.custom_app_url = f"http://localhost:{self.cfg.ui_port}"

        self.session = DJSession(
            silence_pause_s=self.cfg.silence_pause_s,
            drop_onset_threshold=self.cfg.drop_onset_threshold,
            drop_cooldown_s=self.cfg.drop_cooldown_s,
        )
        self.controller = DanceController(self.cfg.preset(), intensity=self.cfg.intensity)
        self.audio = build_audio_source(self.cfg.audio_spec())
        self.feedback = build_dj_feedback(sound=self.cfg.sound_enabled)
        self.drop_dancer = DropDancer(sound=self.cfg.sound_enabled)
        self.history = DJHistory(self.cfg.history_path)

        self._lock = threading.Lock()
        self._intents: list[tuple[str, dict[str, Any]]] = []
        self._robot_label = "idle"
        self._moving = False

        self.server = AppServer(
            self.cfg.app_name, self._snapshot,
            web_dir=_WEB_DIR, host="127.0.0.1", port=self.cfg.ui_port,
            push_interval_s=max(0.1, self.cfg.tick_interval_s),
        )
        self.server.register_command("start", self._cmd_start)
        self.server.register_command("stop", self._cmd_stop)
        self.server.register_command("config", self._cmd_config)
        self.server.register_command("devices", self._cmd_devices)

    # -- commands (run in server thread; only enqueue / read) --------------

    def _cmd_start(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("start", body or {}))
        return {"queued": "start"}

    def _cmd_stop(self, body: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._intents.append(("stop", {}))
        return {"queued": "stop"}

    def _cmd_config(self, body: dict[str, Any]) -> dict[str, Any]:
        body = body or {}
        with self._lock:
            old_dev = self.cfg.audio_device_index
            self.cfg.apply_overrides(**body)
            self.controller.update_preset(self.cfg.preset())
            self.controller.update_intensity(self.cfg.intensity)
            self.audio.set_sensitivity(self.cfg.sensitivity)
            self.feedback.sound = self.cfg.sound_enabled
            self.drop_dancer.sound = self.cfg.sound_enabled
            if self.cfg.audio_device_index != old_dev:
                # swap the capture device in the control loop (touches the stream)
                self._intents.append(("rebuild_audio", {}))
        return self.cfg.public_dict()

    def _cmd_devices(self, body: dict[str, Any]) -> dict[str, Any]:
        return {"devices": list_input_devices()}

    # -- snapshot for UI ---------------------------------------------------

    def _snapshot(self) -> dict[str, Any]:
        with self._lock:
            s = self.session
            f = self.audio.latest()
            return {
                "state": s.state.value,
                "active": s.active,
                "vibing": s.vibing,
                "audio": f.as_dict(),
                "set": {
                    "elapsed_s": round(s.elapsed_s, 1),
                    "vibing_s": round(s.vibing_s, 1),
                    "beats": s.beats,
                    "drops": s.drops,
                    "bpm": round(s.current_bpm, 1),
                    "peak_bpm": round(s.peak_bpm, 1),
                },
                "robot": self._robot_label,
                "moving": self._moving,
                "audio_available": self.audio.available,
                "totals": self.history.totals(),
                "config": self.cfg.public_dict(),
                "genres": genre_choices(),
            }

    # -- control loop ------------------------------------------------------

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        self.server.start_in_thread()
        last = time.monotonic()

        while not stop_event.is_set():
            now = time.monotonic()
            delta = now - last
            last = now

            self._drain_intents(reachy_mini)

            if self.session.active:
                f = self.audio.latest()
                events = self.session.tick(delta, f)
                self._handle_events(reachy_mini, events)
                if self.session.vibing and not f.is_silent:
                    self._dance(reachy_mini, f, delta)
                else:
                    self._moving = False

            time.sleep(self.cfg.tick_interval_s)

        self._end_set(reachy_mini)
        self.server.stop()

    def _drain_intents(self, robot: ReachyMini) -> None:
        with self._lock:
            intents, self._intents = self._intents, []
        for name, _body in intents:
            if name == "start":
                self._rebuild_audio(start=True)  # honor the selected device at start
                with self._lock:
                    self.controller.reset()
                    self.session.start()
                self._safe_feedback(robot, ENTER)
            elif name == "stop":
                self._end_set(robot)
            elif name == "rebuild_audio":
                self._rebuild_audio(start=self.session.active)

    def _rebuild_audio(self, *, start: bool) -> None:
        """Build a fresh audio source from current config (picks up a device change)."""
        new = build_audio_source(self.cfg.audio_spec())
        with self._lock:
            old, self.audio = self.audio, new
        try:
            old.stop()
        except Exception as e:  # noqa: BLE001
            logger.debug("old audio stop error: %s", e)
        if start:
            new.start()

    def _end_set(self, robot: ReachyMini) -> None:
        with self._lock:
            active = self.session.active
            events = self.session.stop()
            stats = self.session.stats()
            genre = self.cfg.genre
        if not active:
            return
        self.audio.stop()
        if events:
            self._safe_feedback(robot, "set_ended")
        # record sets that actually played music
        if stats.vibing_s > 1.0:
            self.history.record(stats, genre=genre)
        self._safe_feedback(robot, EXIT)
        self._moving = False

    def _handle_events(self, robot: ReachyMini, events: list[DJEvent]) -> None:
        for ev in events:
            if ev == DJEvent.MUSIC_STARTED:
                self._safe_feedback(robot, "music_started")
            elif ev == DJEvent.MUSIC_PAUSED:
                self._safe_feedback(robot, "music_paused")
            elif ev == DJEvent.DROP and self.cfg.react_to_drops:
                self._drop(robot)

    def _dance(self, robot: ReachyMini, f, delta: float) -> None:
        m = self.controller.compute(f, dt=max(delta, 1e-3))
        ok = safe_goto(
            robot,
            head=create_head_pose(z=m.head_z, roll=m.head_roll, pitch=m.head_pitch,
                                  mm=True, degrees=True),
            antennas=[m.antenna_left, m.antenna_right],
            body_yaw=float(np.deg2rad(m.body_yaw)),
            duration=self.cfg.move_duration_s,
            method="minjerk",
            what="dance",
        )
        with self._lock:
            self._moving = ok
            self._robot_label = "dancing"

    def _drop(self, robot: ReachyMini) -> None:
        label = self.drop_dancer.play(robot)
        self.controller.reset()  # resume groove cleanly after the takeover
        with self._lock:
            self._robot_label = label

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
    app = ReachyMiniDjReactor()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()


if __name__ == "__main__":
    main()
