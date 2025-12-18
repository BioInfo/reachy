#!/usr/bin/env python3
"""Test script for Reachy Mini simulation."""

from reachy_mini import ReachyMini
from reachy_mini.utils import create_head_pose
import time

print("Connecting to Reachy Mini simulation...")

with ReachyMini() as mini:
    print("Connected! Testing movements...")

    # Look up and tilt head
    print("Moving head up and tilting...")
    mini.goto_target(
        head=create_head_pose(z=20, roll=10, mm=True, degrees=True),
        duration=1.0
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
        duration=1.0
    )
    mini.goto_target(antennas=[0.0, 0.0], duration=0.3)
    time.sleep(1.0)

    print("Test complete!")
