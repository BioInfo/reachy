# Reachy Mini App Roadmap

Planning documents for Reachy Mini application development.

---

## Reachy Companion (Conversation App)

**Status:** Planning Phase | **Created:** 2025-12-20

> A robot on your desk should feel like a presence, not a tool. It should know you, grow with you, and add moments of delight to your day.

### Core Differentiators
1. **Multi-backend LLM support** — OpenAI Realtime, Gemini Live, local models (Ollama/LM Studio)
2. **Persistent memory & relationship** — Remembers you across sessions
3. **Proactive behaviors** — Companion that initiates, not just responds
4. **Enhanced persona studio** — Voice, movement style, emotional mapping

### Planning Documents

| File | Purpose |
|------|---------|
| [00-vision.md](00-vision.md) | Core thesis and what makes this special |
| [01-gap-analysis.md](01-gap-analysis.md) | Analysis of Pollen app and opportunities |
| [02-feature-candidates.md](02-feature-candidates.md) | All features, tiered by priority |
| [03-technical-architecture.md](03-technical-architecture.md) | Provider abstraction, memory system, proactive engine |
| [04-phased-roadmap.md](04-phased-roadmap.md) | MVP and future phase breakdown |
| [05-risks-and-mitigations.md](05-risks-and-mitigations.md) | What could go wrong |
| [06-viral-factors.md](06-viral-factors.md) | What makes this shareable |

---

## Other App Ideas

| File | Purpose |
|------|---------|
| [APP_IDEAS.md](APP_IDEAS.md) | Comprehensive brainstorm of 50+ app ideas |
| [TOP_PICKS.md](TOP_PICKS.md) | Evaluated top picks with scoring |

## Quick Summary

### No-Camera Apps (Build Now)

| App | Value | Effort |
|-----|-------|--------|
| Pomodoro Body Double | High (productivity) | Medium |
| DJ Reactor | High (demo) | Medium |
| Pet Simulator | Medium (fun) | Low |
| Breathing Guide | Medium (wellness) | Low |
| Morning Greeter | Medium (ritual) | Medium |

### Camera Apps (Build Later)

| App | Value | Effort |
|-----|-------|--------|
| Attention Guardian | Very High | High |
| Emotion Mirror | High (viral) | Medium |
| Posture Coach | High (health) | Medium |

## Recommended Next Steps

1. Pick an app from TOP_PICKS.md
2. Create PRD in `apps/[app-name]/PRD.md`
3. Build MVP in simulation
4. Test and iterate

## Design Principles

Apps should leverage what makes robots special:
- Physical presence (body doubling, social accountability)
- Gaze and attention (meaningful looking)
- Body language (expressive movement)
- Spatial awareness (sound direction, room presence)
- Anthropomorphization (emotional bonding)

Avoid apps that could just be phone apps or web pages.

---

*Last updated: 2025-12-20*
