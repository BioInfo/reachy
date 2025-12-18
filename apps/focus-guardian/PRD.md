# Focus Guardian - Product Requirements Document

**Version:** 1.0
**Author:** Justin Johnson
**Created:** 2025-12-18
**Status:** In Development

---

## Overview

Focus Guardian transforms Reachy Mini into a physical productivity body-double that monitors your attention during deep work sessions and provides real-time feedback through expressive robot movements.

### Problem Statement

Knowledge workers struggle with maintaining focus during deep work sessions. Digital tools (browser extensions, app blockers) are easily bypassed and lack the physical presence that creates genuine accountability. The "body doubling" technique (working alongside another person) is highly effective but requires another human.

### Solution

A physical robot companion that:
1. Watches you during focus sessions using computer vision
2. Detects when attention drifts (looking away, checking phone)
3. Provides immediate physical feedback (nudges, expressions)
4. Celebrates completed focus sessions
5. Tracks focus metrics over time

---

## Target Users

### Primary: Knowledge Workers
- Software developers, writers, researchers
- Work from home or private offices
- Already interested in productivity systems (Pomodoro, time-blocking)
- Tech-savvy enough to set up Reachy Mini

### Secondary: Students
- University students during study sessions
- Preparing for exams or working on thesis
- Need external accountability

### Tertiary: ADHD Community
- People who benefit from body doubling
- Need physical cues rather than digital notifications
- Value non-judgmental accountability partners

---

## Core Features

### MVP (v1.0)

#### F1: Focus Session Management
- **F1.1** Start/stop focus sessions via web UI or voice command
- **F1.2** Configurable session duration (default: 25 minutes Pomodoro)
- **F1.3** Visual countdown timer in UI
- **F1.4** Robot enters "focus mode" stance when session starts

#### F2: Attention Monitoring
- **F2.1** Track head pose via Reachy Mini camera
- **F2.2** Detect gaze direction (monitor vs. away)
- **F2.3** Configurable threshold for "distracted" (default: 10 seconds looking away)
- **F2.4** Optional phone detection in field of view

#### F3: Physical Feedback
- **F3.1** Gentle antenna wiggle for first distraction warning
- **F3.2** More pronounced nudge for continued distraction
- **F3.3** Disappointed head shake if user ignores nudges
- **F3.4** Idle "breathing" animation during focused work

#### F4: Session Completion
- **F4.1** Victory dance animation when session completes
- **F4.2** Audio celebration (optional)
- **F4.3** Automatic break reminder before next session
- **F4.4** Session logged to history

#### F5: Basic Statistics
- **F5.1** Sessions completed today
- **F5.2** Focus score (% time focused)
- **F5.3** Number of nudges received
- **F5.4** Display in web UI

### Future Features (v2.0+)

- Voice interaction ("How am I doing?")
- Integration with calendar (auto-start sessions)
- Multi-day statistics and trends
- Customizable robot personality (strict vs. gentle)
- Integration with focus music/ambient sounds
- Team/social accountability features
- Export data to productivity apps

---

## Technical Requirements

### Hardware
- Reachy Mini (Lite or Wireless version)
- Positioned to see user's face (desk placement)
- USB or network connection to host computer

### Software Dependencies
- Python 3.10+
- Gradio (web UI)
- MediaPipe or SmolVLM (head pose estimation)
- Reachy Mini SDK
- OpenCV (camera handling)

### Performance Requirements
- Head pose estimation: < 100ms latency
- Robot response to distraction: < 500ms
- UI updates: Real-time (< 100ms)
- CPU usage: < 30% during monitoring

### Platform Support
- macOS (primary development)
- Linux (Ubuntu 20.04+)
- Windows (planned)

---

## User Experience

### Session Flow

```
1. User opens Focus Guardian web UI
2. Configures session (duration, sensitivity)
3. Clicks "Start Focus Session"
4. Robot enters focus mode (alert posture, blue LEDs)
5. Timer begins countdown
6. During session:
   - User works normally
   - Robot monitors attention
   - Gentle nudges if distracted
   - Escalating feedback if ignored
7. Timer completes
8. Robot performs victory dance
9. UI shows session stats
10. Break timer begins (optional)
```

### Configuration Options

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Session Duration | 25 min | 5-120 min | Focus session length |
| Distraction Threshold | 10 sec | 3-30 sec | Time looking away before nudge |
| Nudge Intensity | Medium | Low/Med/High | How aggressive the feedback |
| Phone Detection | On | On/Off | Detect phone in view |
| Sound Effects | On | On/Off | Audio feedback |
| Break Duration | 5 min | 1-30 min | Break between sessions |

### UI Layout

```
+------------------------------------------+
|  Focus Guardian              [Settings]  |
+------------------------------------------+
|                                          |
|              [ 24:35 ]                   |
|           Staying focused!               |
|                                          |
|  [Camera Feed]     [Robot Status]        |
|                                          |
+------------------------------------------+
|  Sessions: 3  |  Focus: 87%  |  Nudges: 2|
+------------------------------------------+
|        [Start Session]  [End Early]      |
+------------------------------------------+
```

---

## Success Metrics

### Quantitative
- Session completion rate > 80%
- Average focus score > 75%
- User returns for multiple days > 60%
- Average sessions per day > 3

### Qualitative
- Users report feeling more accountable
- Robot feedback feels helpful, not annoying
- Setup takes < 5 minutes
- "I actually finished my work"

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| False positive distractions | High | Medium | Adjustable thresholds, grace period |
| Robot feels annoying | High | Medium | Gentle default settings, customization |
| Camera privacy concerns | Medium | Low | Local processing only, no cloud |
| Poor lighting affects detection | Medium | Medium | Confidence thresholds, fallback modes |
| Robot not visible during work | Low | Low | Placement guide in onboarding |

---

## Development Phases

### Phase 1: Core MVP (Current)
- Basic Gradio UI
- Head pose detection with MediaPipe
- Simple distraction detection
- Core robot animations
- Local session tracking

### Phase 2: Polish
- Improved UI/UX
- Settings persistence
- Better animations
- Sound effects
- Break timer

### Phase 3: Intelligence
- SmolVLM integration for smarter detection
- Voice commands
- Adaptive thresholds based on user patterns
- Daily/weekly reports

### Phase 4: Social
- Share focus scores
- Team accountability
- Leaderboards (optional)

---

## Open Questions

1. Should the robot speak during sessions, or is that too distracting?
2. How to handle video calls (user looking at screen but not "working")?
3. Should there be a "snooze" button for the nudges?
4. Integration with existing Pomodoro apps?

---

## Appendix

### Competitive Analysis

| Product | Type | Accountability | Physical Presence |
|---------|------|----------------|-------------------|
| Forest App | Mobile | Digital rewards | No |
| Focusmate | Web | Human partner | Video only |
| Freedom | Desktop | App blocking | No |
| **Focus Guardian** | Robot | Physical robot | Yes |

### References

- [Body Doubling for ADHD](https://www.additudemag.com/body-doubling-adhd-productivity/)
- [Pomodoro Technique](https://francescocirillo.com/products/the-pomodoro-technique)
- [Reachy Mini Documentation](https://docs.pollen-robotics.com/)
