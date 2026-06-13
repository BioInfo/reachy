#!/usr/bin/env python
"""Text chat with Echo — the conversation brain, no robot, no voice.

The fastest way to feel the personality + latency. Talks to the same brain the
voice loop uses (deepseek-v4-flash via the gateway, reasoning off for snappy
replies). Reads config from apps/echo/.env.

    ./venv/bin/python apps/echo/scripts/chat.py

Type a message and press Enter. 'quit' / Ctrl-D to exit.
"""
from __future__ import annotations
import os, sys, time
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / "apps" / "echo"))

# load apps/echo/.env
env_path = REPO / "apps" / "echo" / ".env"
for line in env_path.read_text().splitlines() if env_path.exists() else []:
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

from echo.config import EchoConfig            # noqa: E402
from echo.conversation import ConversationManager  # noqa: E402
from shared.brain import build_brain          # noqa: E402

cfg = EchoConfig.from_env()
brain = build_brain(cfg.brain_spec())
print(f"Echo brain: {cfg.llm_model}  (reasoning={'off' if not cfg.reasoning_enabled else 'on'})  available={brain.available}")
if not brain.available:
    print("⚠ brain not configured — check apps/echo/.env (ECHO_LLM_BASE_URL / ECHO_LLM_MODEL / ECHO_LLM_API_KEY)")
    sys.exit(1)

mgr = ConversationManager(brain, max_history=cfg.max_history)
print("Say hi to Echo (quit / Ctrl-D to exit).\n")
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
    print(f"echo > {spoken}   [{dt:.1f}s · {emotion}]\n")
print("bye 👋")
