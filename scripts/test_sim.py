#!/usr/bin/env python3
"""Smoke test for a running Reachy Mini daemon (sim or hardware).

Targets the simulation by default (port 8080, matching run_sim.sh). Override
with REACHY_HOST / REACHY_PORT env vars or --host / --port flags so this never
accidentally drives the physical robot daemon (historically on :7860).

    ./scripts/run_test.sh                    # -> sim on :8080
    REACHY_PORT=7860 ./scripts/run_test.sh   # -> hardware on :7860
"""

import argparse
import os
import time

from reachy_mini import ReachyMini
from reachy_mini.utils import create_head_pose

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--host", default=os.environ.get("REACHY_HOST", "127.0.0.1"))
parser.add_argument("--port", type=int, default=int(os.environ.get("REACHY_PORT", "8080")))
args = parser.parse_args()

print(f"Connecting to Reachy Mini at {args.host}:{args.port} ...")

with ReachyMini(host=args.host, port=args.port, connection_mode="localhost_only") as mini:
    print("Connected! Testing movements...")

    # Look up and tilt head
    print("Moving head up and tilting...")
    mini.goto_target(
        head=create_head_pose(z=20, roll=10, mm=True, degrees=True),
        duration=1.0,
    )
    time.sleep(1.5)

    # Move antennas
    print("Moving antennas...")
    mini.goto_target(antennas=[0.6, -0.6], duration=0.3)
    time.sleep(0.5)

    # Return to neutral
    print("Returning to neutral position...")
    mini.goto_target(
        head=create_head_pose(z=0, roll=0, mm=True, degrees=True),
        duration=1.0,
    )
    mini.goto_target(antennas=[0.0, 0.0], duration=0.3)
    time.sleep(1.0)

    print("Test complete!")
