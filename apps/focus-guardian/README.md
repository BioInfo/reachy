# Focus Guardian

A productivity body-double app for Reachy Mini that monitors your attention during deep work sessions and provides physical feedback through expressive robot movements.

## Features

- **Pomodoro Timer**: Configurable focus sessions (default 25 minutes)
- **Attention Monitoring**: Uses head pose estimation to detect when you look away
- **Physical Feedback**: Reachy Mini nudges you with antenna wiggles when distracted
- **Phone Detection**: Optional detection of phones in your field of view
- **Victory Celebration**: Robot performs a dance when you complete a session
- **Daily Statistics**: Track sessions, focus score, and nudges

## Quick Start

### Without Robot (Simulation Mode)

```bash
cd apps/focus-guardian
pip install -r requirements.txt
python app.py --simulation
```

### With Reachy Mini

```bash
pip install -r requirements.txt
pip install reachy-sdk  # Install Reachy SDK separately
python app.py --host <reachy-mini-ip>
```

## Usage

1. Open the web UI (default: http://localhost:7860)
2. Position Reachy Mini to see your face
3. Click "Start Focus Session"
4. Work on your task
5. Reachy will nudge you if you get distracted
6. Complete the session for a victory dance!

## Configuration

Adjust settings in the UI or edit `config.json`:

| Setting | Default | Description |
|---------|---------|-------------|
| Session Duration | 25 min | Length of focus sessions |
| Distraction Threshold | 10 sec | Time looking away before nudge |
| Nudge Intensity | Medium | How aggressive the feedback |
| Phone Detection | On | Detect phones in view |

## How It Works

1. **Vision**: MediaPipe Face Mesh estimates head pose
2. **Attention**: Gaze direction determines focus state
3. **Session**: Timer tracks focused vs distracted time
4. **Feedback**: Robot animations triggered by state changes

## Files

- `app.py` - Main Gradio application
- `focus_session.py` - Session state management
- `attention.py` - Vision-based attention monitoring
- `config.py` - Configuration and settings
- `PRD.md` - Product requirements document
- `CLAUDE.md` - AI assistant context

## HF Spaces Deployment

```bash
# Push to Hugging Face Space
huggingface-cli login
huggingface-cli repo create focus-guardian --type space --sdk gradio
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/focus-guardian
git push hf main
```

## License

MIT License - See repository root for details.
