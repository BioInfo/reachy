# DJ Reactor - Product Requirements Document

**Version:** 1.0
**Author:** Justin Johnson
**Created:** 2025-12-20
**Status:** In Development

---

## Overview

DJ Reactor transforms Reachy Mini into a physical music visualizer that analyzes audio in real-time and moves expressively to the beat, creating a shared musical experience with a robotic dance partner.

### Problem Statement

Listening to music alone can feel isolating. Digital visualizers exist but lack physical presence. Having someone (or something) vibing along with you transforms passive listening into an active, shared experience.

### Solution

A physical robot companion that:
1. Listens to music through the system microphone
2. Analyzes beat, tempo, and frequency characteristics
3. Moves expressively in sync with the music
4. Adapts movement style based on detected or selected genre
5. Creates an ambient, living presence during music sessions

---

## Target Users

### Primary: Music Enthusiasts
- People who listen to music while working, relaxing, or entertaining
- Appreciate physical/tangible interactions over pure digital
- Want their desk companion to "come alive" with their music

### Secondary: Content Creators
- Streamers, YouTubers who want unique desk accessories
- Party hosts looking for conversation pieces
- Musicians/DJs who want visual feedback while creating

### Tertiary: Ambient/Decorative Users
- Want a living desk decoration
- Appreciate hypnotic, calming movement
- Use as ambient companion for focus or relaxation

---

## Core Features

### MVP (v1.0)

#### F1: Audio Input & Analysis
- **F1.1** System audio capture (loopback) or microphone input
- **F1.2** Real-time beat detection with < 50ms latency
- **F1.3** Frequency band analysis (bass, mid, treble)
- **F1.4** BPM estimation and beat tracking
- **F1.5** Audio energy/amplitude monitoring

#### F2: Genre-Aware Movement
- **F2.1** Manual genre selection (Rock, Electronic, Jazz, Pop, Classical, Hip-Hop)
- **F2.2** Genre-specific movement presets:
  - **Rock:** Head banging, dramatic antenna flicks
  - **Electronic:** Pulsing, mechanical, synced to drops
  - **Jazz:** Smooth swaying, subtle movements
  - **Pop:** Bouncy, cheerful, energetic
  - **Classical:** Graceful, conductor-like gestures
  - **Hip-Hop:** Rhythmic bobs, attitude-filled poses
- **F2.3** Intensity scaling based on audio energy
- **F2.4** Smooth transitions between movement states

#### F3: Beat-Synchronized Movements
- **F3.1** Head bobs on beat (configurable intensity)
- **F3.2** Antenna movements on high-frequency hits
- **F3.3** Body rotation (yaw) for emphasis on drops/builds
- **F3.4** Idle "vibing" animation during sustained sections
- **F3.5** Dramatic reactions to drops and builds

#### F4: Special Reactions
- **F4.1** Detect music start → "wake up" animation
- **F4.2** Detect silence/pause → "waiting" or "looking around"
- **F4.3** Detect drop → dramatic build-up and release
- **F4.4** Detect song end → satisfied "that was good" gesture

#### F5: User Interface
- **F5.1** Gradio web UI for control and visualization
- **F5.2** Real-time audio waveform/spectrum display
- **F5.3** Genre selector
- **F5.4** Intensity/sensitivity controls
- **F5.5** Movement preview (shows what robot is doing)
- **F5.6** BPM display

### Future Features (v2.0+)

- Automatic genre detection using ML
- Custom movement choreography editor
- Music-reactive LED patterns (if hardware supports)
- Song recognition and automatic movement presets
- Dance recording and playback
- Community-shared dance moves via HuggingFace
- Integration with Spotify/Apple Music for metadata

---

## Technical Requirements

### Hardware
- Reachy Mini (Lite or Wireless version)
- Microphone or system audio loopback capability
- Host computer with audio interface

### Software Dependencies
- Python 3.10+
- Gradio (web UI)
- librosa or aubio (audio analysis)
- numpy (signal processing)
- sounddevice (audio input)
- Reachy Mini SDK

### Audio Processing Requirements
- Sample rate: 44100 Hz or 48000 Hz
- Chunk size: 1024-2048 samples (20-40ms)
- FFT window: 2048 samples
- Beat detection latency: < 50ms
- Robot response latency: < 100ms total

### Platform Support
- macOS (primary - with BlackHole for loopback)
- Linux (with PulseAudio loopback)
- Windows (with VB-Cable or similar)

---

## Movement Specifications

### Movement Primitives

| Movement | Joint(s) | Range | Use Case |
|----------|----------|-------|----------|
| Head Bob | Head Z | +/- 10mm | Beat tracking |
| Head Nod | Head Pitch | +/- 15° | Emphasis |
| Head Roll | Head Roll | +/- 20° | Vibing |
| Body Sway | Body Yaw | +/- 30° | Groove |
| Antenna Perk | Antennas | 0 to 0.6 | High frequency |
| Antenna Droop | Antennas | -0.3 to 0 | Low energy |
| Antenna Dance | Antennas | Alternating | Celebration |

### Genre Presets

#### Rock
```yaml
tempo_feel: aggressive
head_bob_intensity: high (15mm)
antenna_style: dramatic_flicks
body_sway: minimal
special: head_bang_on_heavy_hits
```

#### Electronic/EDM
```yaml
tempo_feel: mechanical
head_bob_intensity: medium (10mm)
antenna_style: pulsing_sync
body_sway: rotation_on_beat
special: build_up_anticipation, drop_explosion
```

#### Jazz
```yaml
tempo_feel: smooth
head_bob_intensity: low (5mm)
antenna_style: gentle_sway
body_sway: slow_rotation
special: head_tilt_on_improvisation
```

#### Pop
```yaml
tempo_feel: bouncy
head_bob_intensity: medium (8mm)
antenna_style: cheerful_bounce
body_sway: moderate
special: celebration_on_chorus
```

#### Classical
```yaml
tempo_feel: flowing
head_bob_intensity: very_low (3mm)
antenna_style: conductor_gestures
body_sway: graceful_arcs
special: crescendo_building
```

#### Hip-Hop
```yaml
tempo_feel: rhythmic
head_bob_intensity: medium (10mm)
antenna_style: attitude_poses
body_sway: rhythmic_groove
special: freeze_on_breaks
```

---

## User Experience

### Session Flow

```
1. User opens DJ Reactor web UI
2. Selects audio input source (mic or loopback)
3. Selects genre (or auto-detect in v2.0)
4. Adjusts sensitivity/intensity
5. Clicks "Start Vibing"
6. Robot comes alive and syncs to music
7. User enjoys music with physical companion
8. Music stops → robot enters idle state
9. Click "Stop" to end session
```

### UI Layout

```
+------------------------------------------+
|  DJ Reactor                  [Settings]  |
+------------------------------------------+
|                                          |
|  [Audio Waveform Visualization]          |
|                                          |
|  BPM: 128    Energy: ████████░░ 80%      |
|                                          |
+------------------------------------------+
|  Genre: [Rock] [EDM] [Jazz] [Pop] [Chill]|
+------------------------------------------+
|  Intensity: ○────────●──○  Medium        |
|  Sensitivity: ○──●────────○  High        |
+------------------------------------------+
|         [Start Vibing]  [Stop]           |
+------------------------------------------+
|  Robot Status: Vibing to the beat!       |
+------------------------------------------+
```

---

## Success Metrics

### Quantitative
- Robot movement sync accuracy > 90% (movements on beat)
- Latency from audio to movement < 100ms
- Session duration > 15 minutes average
- User returns for multiple sessions > 70%

### Qualitative
- "The robot feels alive"
- "It actually looks like it's enjoying the music"
- "I smile when I see it dancing"
- "Makes listening to music more fun"

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Audio latency too high | High | Medium | Optimize chunk size, use low-latency audio backend |
| Beat detection misses | Medium | Medium | Use multiple detection algorithms, configurable sensitivity |
| Movements feel robotic/unnatural | High | Medium | Add randomness, smooth interpolation, idle variations |
| Audio loopback complex to set up | Medium | High | Clear setup guide, fallback to mic input |
| CPU usage too high | Medium | Low | Optimize FFT, reduce frame rate if needed |

---

## Development Phases

### Phase 1: Core MVP (Current)
- Basic Gradio UI
- Microphone input audio analysis
- Beat detection with librosa
- Single genre (Electronic) movements
- Head bob and antenna sync
- BPM display

### Phase 2: Genre Expansion
- All 6 genre presets
- Manual genre switching
- Genre-specific movement tuning
- Audio energy visualization
- Improved UI

### Phase 3: Polish
- Drop/build detection
- Smooth transitions
- System audio loopback support
- Recording and playback
- Settings persistence

### Phase 4: Intelligence
- Automatic genre detection (ML model)
- Song section detection (verse/chorus)
- Adaptive movement based on user feedback
- Community dance sharing

---

## Open Questions

1. Should we support multiple audio input sources simultaneously?
2. How to handle very quiet or very loud audio (normalization)?
3. Should there be a "calm mode" for ambient/study music?
4. Integration with smart home (react to doorbell, etc.)?

---

## Appendix

### Audio Analysis Reference

| Feature | Library | Use |
|---------|---------|-----|
| Beat Detection | librosa.beat | BPM, beat frames |
| Onset Detection | librosa.onset | Transient detection |
| Spectral Analysis | numpy.fft | Frequency bands |
| Amplitude | sounddevice | Volume/energy |
| Tempo | librosa.beat.tempo | BPM estimation |

### Movement Mapping

```python
# Simplified mapping logic
bass_energy → body_sway_intensity
mid_energy → head_bob_intensity
treble_energy → antenna_activity
beat_detected → trigger_bob_animation
drop_detected → trigger_dramatic_reaction
silence_detected → enter_idle_mode
```

### References

- [librosa Documentation](https://librosa.org/doc/)
- [Reachy Mini SDK](https://github.com/pollen-robotics/reachy_mini)
- [Beat Detection Algorithms](https://en.wikipedia.org/wiki/Beat_detection)
- [Music Information Retrieval](https://musicinformationretrieval.com/)
