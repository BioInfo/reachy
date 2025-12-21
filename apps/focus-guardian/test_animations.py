#!/usr/bin/env python3
"""Quick test of robot animations for Focus Guardian."""

import sys
import time
sys.path.insert(0, '../..')

print("Testing Focus Guardian robot animations...")
print("=" * 50)

# Import shared utilities
from shared.reachy_utils import get_robot, attention_wiggle, disappointed_shake, victory_dance
from shared.reachy_utils.animations import focus_mode_enter, focus_mode_exit, idle_breathing

# Get robot connection
print("\n1. Connecting to robot...")
robot = get_robot()
print(f"   Robot connected: {not robot.is_mock}")

if robot.is_mock:
    print("\n   Running in mock mode - no physical animations will play.")
    print("   Start the Reachy daemon and try again.")
    sys.exit(0)

# Get actual robot instance
r = robot.robot

# Test animations
print("\n2. Testing focus_mode_enter...")
focus_mode_enter(r)
print("   Done! Robot should look alert with perked antennas.")
time.sleep(2)

print("\n3. Testing idle_breathing (1 cycle)...")
idle_breathing(r, cycles=1)
print("   Done! Subtle breathing animation.")
time.sleep(1)

print("\n4. Testing attention_wiggle...")
attention_wiggle(r)
print("   Done! Quick antenna flick to get attention.")
time.sleep(2)

print("\n5. Testing disappointed_shake (medium intensity)...")
disappointed_shake(r, intensity=0.7)
print("   Done! Head shake with droopy antennas.")
time.sleep(2)

print("\n6. Testing victory_dance (2 seconds)...")
victory_dance(r, duration=2.0)
print("   Done! Celebratory dance!")
time.sleep(1)

print("\n7. Testing focus_mode_exit...")
focus_mode_exit(r)
print("   Done! Back to neutral position.")

print("\n" + "=" * 50)
print("All animations tested successfully!")
