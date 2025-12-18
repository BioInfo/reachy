# Quickstart Guide

## 1. Prerequisites

- Python 3.10-3.13
- Virtual environment with `reachy-mini` installed

## 2. Ensure the Daemon is Running

| Platform | How to Start |
|----------|--------------|
| **Reachy Mini (Wireless)** | Automatic when powered on |
| **Reachy Mini Lite (USB)** | Desktop app or `reachy-mini-daemon` |
| **Simulation** | Desktop app or `reachy-mini-daemon --sim` |

**Verify:** Open http://localhost:8000 - you should see the Reachy Dashboard.

## 3. Your First Script

```python
from reachy_mini import ReachyMini

# Connect to the running daemon
with ReachyMini() as mini:
    print(f"Connected! Robot State: {mini.state}")

    # Wiggle antennas
    print("Wiggling antennas...")
    mini.goto_target(antennas=[0.5, -0.5], duration=0.5)
    mini.goto_target(antennas=[-0.5, 0.5], duration=0.5)
    mini.goto_target(antennas=[0, 0], duration=0.5)

    print("Done!")
```

Run it:
```bash
python hello.py
```

## Next Steps

- [Python SDK](python-sdk.md) - Full API reference
- [Integration](integration.md) - Connect LLMs, build Apps
- [Core Concepts](core-concepts.md) - Architecture, coordinates, safety
