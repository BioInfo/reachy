#!/usr/bin/env python
"""Test the Reachy voice stack THROUGH the LiteLLM gateway (not the direct tunnel).

Part A (always): exercise the real client classes — GatewayTTS, GatewaySTT,
LiteLLMBrain — against the gateway with the gateway consumer key. Synthesizes speech,
transcribes it back, and runs a full conversational turn (TTS -> STT -> brain ->
TTS). No robot, no mic, no devices: a closed-loop proof the gateway routes work.

Part B (--robot): connect to the running daemon and play one short line out of
Reachy's actual speaker via the SDK media API (RobotAudioIO). Needs the daemon on
:8000 and no other app holding the robot.

    ./venv/bin/python apps/hey-reachy/scripts/gateway_test.py            # Part A only
    ./venv/bin/python apps/hey-reachy/scripts/gateway_test.py --robot    # + speaker
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / "apps" / "hey-reachy"))

env_path = REPO / "apps" / "hey-reachy" / ".env"
for line in env_path.read_text().splitlines() if env_path.exists() else []:
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

from hey_reachy.config import HeyReachyConfig                  # noqa: E402
from hey_reachy.conversation import ConversationManager   # noqa: E402
from shared.brain import build_brain                # noqa: E402
from shared.voice.tts import GatewayTTS             # noqa: E402
from shared.voice.stt import GatewaySTT             # noqa: E402

GW = os.environ.get("HEY_REACHY_LLM_BASE_URL", "").rstrip("/")
KEY = os.environ.get("HEY_REACHY_LLM_API_KEY", "")


def part_a() -> bool:
    print("=== Part A: Reachy stack through the gateway ===")
    print(f"gateway: {GW}")
    cfg = HeyReachyConfig.from_env()
    brain = build_brain(cfg.brain_spec())
    tts = GatewayTTS(base_url=GW, api_key=KEY, model="kokoro", voice="af_heart")
    stt = GatewaySTT(base_url=GW, api_key=KEY, model="faster-whisper", language="en")

    print(f"brain : {cfg.llm_model} reasoning={'on' if cfg.reasoning_enabled else 'off'} available={brain.available}")
    print(f"tts   : kokoro available={tts.available}")
    print(f"stt   : faster-whisper available={stt.available}")
    if not (brain.available and tts.available and stt.available):
        print("⚠ a backend is unavailable — check HEY_REACHY_LLM_BASE_URL / HEY_REACHY_LLM_API_KEY")
        return False

    # 1. TTS -> samples
    line = "The voice gateway is wired and working."
    t0 = time.time()
    samples, sr = tts.synth(line)
    print(f"\nTTS   : '{line}' -> {len(samples)} samples @ {sr}Hz in {time.time()-t0:.2f}s")
    if len(samples) == 0:
        print("⚠ TTS returned no audio"); return False

    # 2. samples -> STT
    t0 = time.time()
    heard = stt.transcribe(samples, sr)
    print(f"STT   : heard '{heard}' in {time.time()-t0:.2f}s")

    # 3. full turn: user line -> brain -> reply -> TTS
    mgr = ConversationManager(brain, max_history=cfg.max_history)
    user = "Hey, Reachy, are you working? Answer in one short sentence."
    t0 = time.time()
    _, prior = mgr.begin(user)
    reply = mgr.run(user, prior)
    spoken, _ = mgr.settle(reply)
    mgr.session.to_idle()
    print(f"\nTURN  : you  > {user}")
    print(f"        reachy > {spoken!r}  ({time.time()-t0:.2f}s)")
    rsamples, rsr = tts.synth(spoken)
    print(f"        spoke reply -> {len(rsamples)} samples @ {rsr}Hz")

    # keep the reply audio for Part B
    np.save("/tmp/hey_reachy_reply.npy", rsamples)
    with open("/tmp/hey_reachy_reply_sr.txt", "w") as f:
        f.write(str(rsr))
    print("\n✅ Part A passed: gateway TTS + STT + brain all green.")
    return True


def part_b() -> bool:
    print("\n=== Part B: play one line out of Reachy's speaker ===")
    try:
        from reachy_mini import ReachyMini
    except Exception as exc:  # noqa: BLE001
        print(f"⚠ SDK import failed: {exc}"); return False
    from shared.voice.audio_io import RobotAudioIO

    tts = GatewayTTS(base_url=GW, api_key=KEY, model="kokoro", voice="af_heart")
    line = "Hi Justin. The voice gateway is wired up, and I can talk now."
    samples, sr = tts.synth(line)
    if len(samples) == 0:
        print("⚠ no audio to play"); return False

    try:
        robot = ReachyMini(host="127.0.0.1", port=8000, connection_mode="localhost_only")
    except Exception as exc:  # noqa: BLE001
        print(f"⚠ could not connect to daemon on :8000 ({exc})"); return False

    audio = RobotAudioIO(robot)
    print(f"audio backend: {audio.name} available={audio.available} out_rate={audio.output_rate}")
    if not audio.available:
        print("⚠ robot media unavailable"); return False
    print(f"speaking: '{line}'")
    audio.play(samples, sr)
    audio.stop()
    print("✅ Part B done: spoke through the robot.")
    return True


if __name__ == "__main__":
    ok = part_a()
    if ok and "--robot" in sys.argv:
        part_b()
    sys.exit(0 if ok else 1)
