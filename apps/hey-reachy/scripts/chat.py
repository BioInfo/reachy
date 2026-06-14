#!/usr/bin/env python
"""Text chat with Reachy — the conversation brain, no robot, no voice.

The fastest way to feel the personality + latency. Talks to the same brain the
voice loop uses (deepseek-v4-flash via the gateway, reasoning off for snappy
replies). Reads config from apps/hey-reachy/.env.

    ./venv/bin/python apps/hey-reachy/scripts/chat.py

Type a message and press Enter. 'quit' / Ctrl-D to exit.
"""
from __future__ import annotations
import os, sys, time
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / "apps" / "hey-reachy"))

# load apps/hey-reachy/.env
env_path = REPO / "apps" / "hey-reachy" / ".env"
for line in env_path.read_text().splitlines() if env_path.exists() else []:
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

from hey_reachy.config import HeyReachyConfig            # noqa: E402
from hey_reachy.conversation import ConversationManager  # noqa: E402
from shared.brain import build_brain          # noqa: E402

cfg = HeyReachyConfig.from_env()
brain = build_brain(cfg.brain_spec())
print(f"Reachy brain: {cfg.llm_model}  (reasoning={'off' if not cfg.reasoning_enabled else 'on'})  available={brain.available}")
if not brain.available:
    print("⚠ brain not configured — check apps/hey-reachy/.env (HEY_REACHY_LLM_BASE_URL / HEY_REACHY_LLM_MODEL / HEY_REACHY_LLM_API_KEY)")
    sys.exit(1)

mgr = ConversationManager(brain, max_history=cfg.max_history)
print("Say hi to Reachy (quit / Ctrl-D to exit).\n")
while True:
    try:
        text = input("you  > ").strip()
    except EOFError:
        print(); break
    if not text:
        continue
    if text.lower() in ("quit", "exit", "bye"):
        break
    _, prior = mgr.begin(text)
    t0 = time.time()
    reply = mgr.run(text, prior)
    spoken, emotion = mgr.settle(reply)
    mgr.session.to_idle()
    dt = time.time() - t0
    print(f"reachy > {spoken}   [{dt:.1f}s · {emotion}]\n")
print("bye 👋")
