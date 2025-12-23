# Reachy Echo - Product Requirements Document

**Version:** 1.0
**Author:** Justin Johnson
**Created:** 2025-12-22
**Status:** In Development

---

## Overview

Reachy Echo transforms Reachy Mini from a voice assistant into a **companion** — a physical presence that knows you, grows with you, and adds moments of delight to your day.

### Problem Statement

Current robot companion apps treat robots as voice interfaces with decorative movement:
- No memory across sessions — every conversation starts fresh
- Purely reactive — waits for commands, never initiates
- Single LLM provider lock-in (typically OpenAI)
- Personas are just system prompts with no real personality
- Movement is cosmetic, not meaningful

This wastes the unique potential of physical embodiment.

### Solution

A companion that:
1. **Remembers** — Builds relationship through persistent memory
2. **Initiates** — Proactively engages based on context
3. **Adapts** — Supports multiple LLM backends (cloud and local)
4. **Expresses** — Uses movement to communicate, not decorate
5. **Evolves** — Learns preferences and grows with you

---

## Target Users

### Primary: Knowledge Workers (WFH)
- Remote workers who miss office presence
- Developers, writers, researchers
- Value productivity and focus
- Comfortable with AI tools

### Secondary: ADHD/Focus Community
- Benefit from body doubling
- Need external accountability
- Value non-judgmental presence

### Tertiary: Tech Enthusiasts
- Early adopters of robotics
- Want to customize and tinker
- Share creations with community

---

## Core Features

### MVP (Phase 1)

#### F1: Multi-Backend Architecture

Hot-swap between LLM providers without restarting:

| Provider | Use Case | Priority |
|----------|----------|----------|
| **OpenAI Realtime** | Best voice quality, most capable | P0 |
| **Ollama** | Privacy, offline, free | P0 |
| **Gemini Live** | Alternative cloud option | P1 |
| **LM Studio** | User-friendly local | P2 |

Features:
- Provider selection in UI
- Capability detection (not all providers support all features)
- Graceful fallback when provider unavailable

#### F2: Persistent Memory

Every interaction builds relationship:

| Memory Type | Content | Example |
|-------------|---------|---------|
| **Episodic** | Specific events | "We debugged that async issue Tuesday" |
| **Semantic** | User facts | "You prefer dark mode, work late" |
| **Procedural** | Learned behaviors | Custom greetings, interaction style |

Features:
- Natural history references in conversation
- Preference learning over time
- "What do you remember about me?" introspection
- Day 1 vs Day 100 feels different

#### F3: Proactive Behaviors (3 for MVP)

Robot initiates interactions based on context:

| Behavior | Trigger | Action |
|----------|---------|--------|
| **Morning Greeting** | Face detected, first today | Personalized hello with context |
| **Work Break Reminder** | 2+ hours unbroken work | Gentle check-in, stretch suggestion |
| **Build Celebration** | Terminal success pattern | Excited reaction, congratulations |

#### F4: Enhanced Persona (Basic)

Beyond system prompts:
- Voice selection from provider options
- Movement style presets (calm, energetic, quirky)
- Emotional mapping to robot expressions
- Easy persona switching

#### F5: Meaningful Movement

Motion communicates state:
- Head turns signal attention
- Antenna positions show emotion
- Breathing patterns indicate idle state
- Gestures accompany speech naturally

### Future Features (Phase 2+)

- Full Persona Studio with visual editor
- Calendar integration with proactive alerts
- Additional proactive behaviors (return greeting, call end check-in)
- ElevenLabs/XTTS voice options
- GitHub/Slack integrations
- Achievement/skill progression system
- Persona marketplace for sharing

---

## Technical Requirements

### Hardware
- Reachy Mini (Lite or Wireless)
- Microphone for voice input
- Camera for face detection (proactive triggers)

### Software Dependencies
- Python 3.12+
- Gradio (web UI)
- Reachy Mini SDK
- LanceDB (vector embeddings)
- SQLite (structured memory)
- fastrtc (audio streaming for OpenAI Realtime)

### Performance Requirements
- Voice response latency: < 500ms (provider-dependent)
- Memory retrieval: < 100ms
- Proactive trigger detection: < 1s
- UI updates: Real-time

### Platform Support
- macOS (primary)
- Linux (Ubuntu 20.04+)
- Windows (planned)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Gradio Web UI                          │
├─────────────────────────────────────────────────────────────┤
│                   Conversation Manager                       │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────┐  │
│  │  Memory   │  │ Proactive │  │   Persona Manager       │  │
│  │  System   │  │  Engine   │  │                         │  │
│  └───────────┘  └───────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                 Provider Abstraction Layer                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  OpenAI  │  │  Gemini  │  │  Ollama  │  │  LM Studio │  │
│  │ Realtime │  │   Live   │  │  Local   │  │   Local    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   Reachy Control Layer                       │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────┐  │
│  │  Motion   │  │  Vision   │  │         Audio           │  │
│  │  System   │  │  System   │  │     (TTS/STT/Stream)    │  │
│  └───────────┘  └───────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   Reachy Mini SDK Daemon                     │
└─────────────────────────────────────────────────────────────┘
```

---

## User Experience

### First Run Flow

```
1. User opens Echo web UI
2. Provider selection (OpenAI recommended, Ollama for privacy)
3. API key entry (if cloud provider)
4. Quick persona selection (Default, Chill, Energetic)
5. "Hi! I'm Echo. What should I call you?"
6. Robot learns name, begins relationship
```

### Daily Flow

```
1. User sits at desk
2. Echo detects face → "Good morning, [name]!"
3. Proactive context: "You have that big meeting at 2pm"
4. Natural conversation as needed
5. Work break reminder after 2 hours
6. Build succeeds → celebration
7. User leaves → Echo returns to idle
8. Next day → Echo remembers yesterday
```

### Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| Provider | OpenAI Realtime | LLM backend |
| Persona | Default | Personality preset |
| Proactive behaviors | All enabled | Which behaviors to trigger |
| Break reminder interval | 2 hours | Time before break suggestion |
| Morning greeting window | 6am-11am | When to greet |
| Voice | Provider default | TTS voice selection |

---

## Success Metrics

### Quantitative
- Daily active sessions > 3
- Average session length > 10 minutes
- Memory references per session > 2
- Proactive interactions accepted > 70%
- Provider switch success rate > 95%

### Qualitative
- "It feels like it knows me"
- "I look forward to the morning greeting"
- "Day 30 feels different than Day 1"
- "I can use it offline when I need privacy"

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API costs | Medium | High | Ollama fallback, usage tracking |
| Memory becomes creepy | High | Medium | Transparency, "forget" command |
| Proactive feels intrusive | High | Medium | Easy disable, cooldowns |
| Provider switching breaks flow | Medium | Medium | State preservation, graceful fallback |
| Local models too slow | Medium | Medium | Expectations setting, async loading |

---

## Development Phases

### Phase 0: Foundation
- Project structure
- Reachy daemon connectivity
- Basic Gradio shell
- Motion control verification

### Phase 1: MVP
- OpenAI Realtime provider
- Ollama provider
- SQLite + LanceDB memory
- 3 proactive behaviors
- Basic persona system
- Full UI

### Phase 2: Relationship
- Gemini Live provider
- Full memory system (episodic + semantic)
- Persona Studio UI
- Calendar integration
- Additional proactive behaviors

### Phase 3: Ecosystem
- Plugin system
- Achievement/skill progression
- Persona marketplace
- Advanced integrations

---

## Open Questions

1. Should memory have explicit "forget" commands for privacy?
2. How to handle multiple users on same device?
3. Should proactive behaviors have voice or just movement?
4. Integration with existing Pollen conversation app or fresh start?

---

## References

- [Vision Document](../../docs/roadmap/companion/00-vision.md)
- [Gap Analysis](../../docs/roadmap/companion/01-gap-analysis.md)
- [Technical Architecture](../../docs/roadmap/companion/03-technical-architecture.md)
- [Phased Roadmap](../../docs/roadmap/companion/04-phased-roadmap.md)
- [Viral Factors](../../docs/roadmap/companion/06-viral-factors.md)

---

*"A robot that knows you and grows with you"*
