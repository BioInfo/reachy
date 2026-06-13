---
title: DJ Reactor
emoji: "🎵"
colorFrom: purple
colorTo: blue
sdk: static
pinned: false
license: mit
short_description: "Music visualizer - Reachy Mini dances to your beat!"
tags:
  - reachy_mini
  - reachy_mini_python_app
  - robot
  - music
  - visualization
  - dance
---

# DJ Reactor

A music visualizer for Reachy Mini that turns your robot into a dance partner. It
listens to whatever's playing, finds the beat, and grooves along in real time:
body sway on the bass, head bob on the mids, antennas on the treble, and a
signature move when a drop hits.

v2 is a ground-up rebuild on a shared app layer (audio analysis, robot motion,
persistence, and a live React control panel) reused across the Reachy Mini apps.

## What it does

- **Real-time audio analysis** - FFT splits the sound into bass / mid / treble and
  tracks energy onsets to detect beats and estimate BPM.
- **Beat-synced dancing** - bass drives a big body sway, mids drive the head,
  treble bounces the antennas, and each beat punches an emphasis (headbang, nod,
  or tilt) chosen by the genre.
- **Genre styles** - Electronic, Rock, Hip-Hop, Pop, Jazz, Classical, Chill, each
  with its own movement character.
- **Drop reactions** - a heavy onset triggers a signature dance-library move that
  briefly takes over, then the groove resumes.
- **Live control panel** - a React UI shows the beat pulse, the three bands, BPM,
  and your set stats, with genre / intensity / sensitivity / sound controls.

## How it works

```
Audio device → FFTBeatAnalyzer → AudioFeatures → DanceController → goto_target
                     │                                   │
                  bands + beat + BPM              smoothed, bounded motion
                     │                                   │
              DJSession (set events) ──── EmotionFeedback / DropDancer
                     │
              live state → WebSocket → React panel
```

Frequency mapping:

- **Bass (20-250 Hz)** → body sway
- **Mid (250-2000 Hz)** → head bob and roll
- **Treble (2000-12000 Hz)** → antenna bounce
- **Beat / onset** → emphasis kick and drop reactions

## Running

1. Start the daemon (installed apps connect on port 8000):
   ```bash
   reachy-mini-daemon --fastapi-port 8000
   ```
2. Open the dashboard at http://localhost:8000, find **DJ Reactor**, and start it.
3. Open the control panel, pick a genre, and play some music.

The panel is also reachable directly at http://localhost:7861 while the app runs.

## System audio (macOS)

To dance to system audio (Spotify, YouTube) instead of the microphone, route
output through a loopback device:

1. Install [BlackHole](https://existential.audio/blackhole/).
2. In Audio MIDI Setup, make a Multi-Output Device (your speakers + BlackHole) and
   set it as the system output.
3. In the panel, select the BlackHole input device.

## Configuration

Everything is env-overridable (`DJ_*`) and most is also live in the panel:

| Setting | Env | Default | Notes |
|---------|-----|---------|-------|
| Genre | `DJ_GENRE` | electronic | movement style |
| Intensity | `DJ_INTENSITY` | 0.7 | how dramatic the motion is (0.1-1.0) |
| Sensitivity | `DJ_SENSITIVITY` | 0.6 | how easily beats trigger (0.2-1.0) |
| Sound | `DJ_SOUND_ENABLED` | on | reaction sounds (music app → on by default) |
| Drop reactions | `DJ_REACT_TO_DROPS` | on | signature move on a drop |
| Audio device | `DJ_AUDIO_DEVICE` | system default | input device index |
| UI port | `DJ_UI_PORT` | 7861 | control panel port |

## License

MIT License. Built for the [Reachy Mini](https://github.com/pollen-robotics/reachy_mini)
platform by Pollen Robotics.
