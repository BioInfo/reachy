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

A music visualizer for Reachy Mini that makes your robot dance to the beat!

## Features

- **Real-time Audio Analysis** - Analyzes bass, mid, and treble frequencies
- **Expressive Dancing** - Full body sway, head bob, and antenna movements
- **Beat Detection** - Extra punch on detected beats
- **Multiple Audio Sources** - Microphone, system audio loopback, or any input

## Installation

```bash
pip install git+https://huggingface.co/spaces/RyeCatcher/dj_reactor
```

## Usage

1. Start the Reachy Mini daemon:
   ```bash
   reachy-mini-daemon  # or --sim for simulation
   ```

2. Open the dashboard at http://localhost:8000

3. Find "DJ Reactor" in Applications and click Start

4. Select your audio input and start vibing!

## System Audio Setup (macOS)

To capture system audio (Spotify, YouTube, etc.):

1. Install [BlackHole](https://existential.audio/blackhole/) audio driver
2. Open Audio MIDI Setup
3. Create a Multi-Output Device with your speakers + BlackHole
4. Set as system output
5. Select "BlackHole 2ch" as input in DJ Reactor

## How It Works

DJ Reactor uses real-time FFT analysis to extract:
- **Bass (20-250 Hz)** → Body sway intensity
- **Mid (250-2000 Hz)** → Head movement
- **Treble (2000-12000 Hz)** → Antenna activity
- **Beat detection** → Extra head dip on beats

The robot's movements are synchronized to an internal groove cycle that adjusts with the detected BPM.

## Configuration

- **Intensity Slider** - Control how dramatic the movements are (0.1-1.0)
- **Audio Device** - Select microphone or loopback device

## Requirements

- Reachy Mini robot or simulator
- Python 3.10+
- Audio input device

## License

MIT License

## Credits

Built for the [Reachy Mini](https://github.com/pollen-robotics/reachy_mini) platform by Pollen Robotics.
