---
title: Focus Guardian
emoji: "🎯"
colorFrom: purple
colorTo: blue
sdk: static
pinned: false
license: mit
tags:
  - reachy_mini
  - reachy_mini_python_app
  - productivity
  - pomodoro
  - focus
---

# Focus Guardian

A productivity body-double app for Reachy Mini that monitors your presence during deep work sessions and provides physical feedback through expressive robot movements.

## Features

- **Pomodoro Timer**: Configurable focus sessions (5-60 minutes, default 25)
- **Motion-Based Presence Detection**: Detects when you leave your desk via camera
- **Physical Feedback**: Reachy Mini nudges you with antenna wiggles and head shakes
- **Sound Effects**: Audio cues for session start, nudges, and completion
- **Victory Celebration**: Robot performs a dance when you complete a session
- **Session Statistics**: Track focus time, nudges, and completion

## How It Works

1. **Camera**: Captures frames at 2Hz from robot's camera
2. **Motion Detection**: Analyzes left 40% of frame (where user sits)
3. **Presence**: Motion = at desk, stillness for 3+ sec = away
4. **Feedback**: Robot animations triggered by state changes

## Running Locally

### With Reachy Mini Desktop App (Recommended)

1. Install into the desktop app venv:
```bash
/Applications/Reachy\ Mini\ Control.app/Contents/Resources/reachy_mini_focus_guardian_venv/bin/pip install /path/to/focus-guardian
```

2. Launch from Reachy Mini Control dashboard

### With CLI Daemon

```bash
# Install
pip install -e /path/to/focus-guardian

# Start daemon
reachy-mini-daemon

# App appears in dashboard at http://localhost:8000
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Duration | 25 min | Length of focus sessions (5-60 min) |
| Distraction Threshold | 10 sec | Time away before nudge triggers |
| Use Camera | On | Enable motion-based presence detection |
| Robot Position | Right | Where robot sits relative to you |

## Files

```
focus-guardian/
├── reachy_mini_focus_guardian/
│   ├── __init__.py
│   └── main.py          # Main application (ReachyMiniApp)
├── pyproject.toml       # Package configuration
├── requirements.txt     # Dependencies
├── PRD.md              # Product requirements
├── CLAUDE.md           # AI assistant context
└── README.md           # This file
```

## Dependencies

- `reachy-mini>=1.0.0` - Reachy Mini SDK
- `numpy>=1.24.0` - Numerical operations
- `gradio>=4.0.0` - Web UI
- `mediapipe>=0.10.0` - Computer vision (fallback)
- `opencv-python>=4.8.0` - Image processing

## License

MIT License
