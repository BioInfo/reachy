# Reachy Mini Documentation

Local copy of SDK documentation for quick reference.

## SDK Reference

| Document | Description |
|----------|-------------|
| [quickstart.md](sdk/quickstart.md) | First steps, verify setup |
| [python-sdk.md](sdk/python-sdk.md) | Full API reference |
| [core-concepts.md](sdk/core-concepts.md) | Architecture, coordinates, safety |
| [integration.md](sdk/integration.md) | LLM integration, REST API, Apps |
| [installation.md](sdk/installation.md) | Setup instructions |

## Troubleshooting

| Document | Description |
|----------|-------------|
| [troubleshooting.md](troubleshooting.md) | FAQ, common issues, fixes |

## Quick API Reference

### Movement
```python
from reachy_mini import ReachyMini
from reachy_mini.utils import create_head_pose
import numpy as np

with ReachyMini() as mini:
    # Smooth movement
    mini.goto_target(
        head=create_head_pose(z=10, roll=15, mm=True, degrees=True),
        antennas=np.deg2rad([30, -30]),
        body_yaw=np.deg2rad(20),
        duration=1.5,
        method="minjerk"
    )

    # Instant (for streaming/joystick)
    mini.set_target(head=pose)
```

### Media
```python
frame = mini.media.get_frame()           # Camera (OpenCV)
sample = mini.media.get_audio_sample()   # Microphone
mini.media.play_sound("file.wav")        # Speaker
```

### Motor Control
```python
mini.enable_motors()               # Stiff
mini.disable_motors()              # Limp
mini.enable_gravity_compensation() # Soft/teachable
```

### Recording
```python
mini.start_recording()
# ... movements ...
data = mini.stop_recording()
```

## REST API

When daemon is running:
- **Docs:** http://localhost:8000/docs
- **State:** `GET /api/state/full`
- **WebSocket:** `ws://localhost:8000/api/state/ws/full`

## External Links

- [GitHub: reachy_mini](https://github.com/pollen-robotics/reachy_mini)
- [Conversation App](https://github.com/pollen-robotics/reachy_mini_conversation_app)
- [HuggingFace Apps Tutorial](https://huggingface.co/blog/pollen-robotics/make-and-publish-your-reachy-mini-apps)
- [Discord](https://discord.gg/2bAhWfXme9)
