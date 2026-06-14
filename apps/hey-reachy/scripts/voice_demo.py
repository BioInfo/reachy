#!/usr/bin/env python
"""Talk to Reachy on your laptop — full voice loop, no robot needed.

Uses your local mic + speakers (LocalAudioIO) instead of the robot, the Kokoro TTS
and faster-whisper STT services on a remote GPU host (reached over an SSH tunnel,
see below), and the same chat brain as the text chat. This is the real loop:
   (just talk) -> VAD records -> Whisper -> brain -> Kokoro -> your speakers.

SETUP (one terminal) -- replace <gpu-host> with the SSH host running the services:
    ssh -N -L 8810:127.0.0.1:8810 -L 8811:127.0.0.1:8811 <gpu-host>
THEN (another terminal):
    ./venv/bin/python apps/hey-reachy/scripts/voice_demo.py

Tips: use HEADPHONES (or it may hear its own voice on the next turn). It listens
continuously (no "Hey, Reachy" wake word yet — that needs the Picovoice key). Just
talk, pause, and it answers. Ctrl-C to stop.

Env overrides: VOICE_TTS_URL, VOICE_STT_URL (default the localhost tunnel).
"""
from __future__ import annotations
import os, sys, signal, time
from pathlib import Path

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
import shared.voice as V                            # noqa: E402
from shared.voice.tts import GatewayTTS             # noqa: E402
from shared.voice.stt import GatewaySTT             # noqa: E402

TTS_URL = os.environ.get("VOICE_TTS_URL", "http://127.0.0.1:8810/v1")
STT_URL = os.environ.get("VOICE_STT_URL", "http://127.0.0.1:8811/v1")

cfg = HeyReachyConfig.from_env()
brain = build_brain(cfg.brain_spec())
mgr = ConversationManager(brain, max_history=cfg.max_history)

tts = GatewayTTS(base_url=TTS_URL, model="kokoro", voice="af_heart")
stt = GatewaySTT(base_url=STT_URL, model="faster-whisper", language="en")
audio = V.LocalAudioIO(input_rate=16000, output_rate=24000)
vad = V.VADSegmenter(silence_ms=700, min_speech_ms=250)
wake = V.build_wake({"kind": "always"})   # no wake word yet; just talk

print("=== Reachy voice demo ===")
print(f"brain: {cfg.llm_model} (reasoning {'off' if not cfg.reasoning_enabled else 'on'}) available={brain.available}")
print(f"tts  : {TTS_URL}  available={tts.available}")
print(f"stt  : {STT_URL}  available={stt.available}")
print(f"audio: {audio.name}  available={audio.available}")
for nm, ok in [("brain", brain.available), ("tts", tts.available), ("stt", stt.available), ("audio", audio.available)]:
    if not ok:
        print(f"\n⚠ {nm} not available — fix that first (tunnel up? .env set? mic permission?).")
        sys.exit(1)

def respond(text: str) -> str:
    _, prior = mgr.begin(text)
    reply = mgr.run(text, prior)
    spoken, _ = mgr.settle(reply)
    mgr.session.to_idle()
    return spoken

def on_event(event: str, payload: dict) -> None:
    if event == "waiting":     print("… (listening — just talk)")
    elif event == "transcript": print(f"you  > {payload.get('text','')}")
    elif event == "thinking":   print("      (thinking…)")
    elif event == "speaking":   print(f"reachy > {payload.get('text','')}")
    elif event == "error":      print(f"⚠ {payload.get('error','')}")

loop = V.VoiceLoop(audio, respond=respond, wake=wake, vad=vad, stt=stt, tts=tts, on_event=on_event)
signal.signal(signal.SIGINT, lambda *_: (print("\nstopping…"), loop.stop(), sys.exit(0)))
print("\nStart talking. Ctrl-C to stop.\n")
loop.start()
while loop.running:
    time.sleep(0.3)
