# Reachy Echo — Product Requirements Document

**Version:** 2.1
**Author:** Justin Johnson
**Created:** 2025-12-22 · **Rewritten:** 2026-06-13
**Status:** Planning (v2 POC on the shared app layer)

---

## Overview

Echo is a conversation companion for Reachy Mini. You talk to it; it talks back
and reacts with its whole body. The conversation runs through a **pluggable
brain**, so the first public release can be a simple, well-tuned chatbot, and the
same app can later grow into an embodied front-end for a personal assistant agent.

The reason to build this on a robot and not in a chat window is the body. A desk
robot can look at you, turn toward your voice, hold a "thinking" pose, nod while it
talks, and go quiet when you leave. Echo treats the robot's physical reaction as
the product and the language model as the engine behind it.

### Scope: a small POC first

This is deliberately a small first cut. Ship one good conversational loop with
strong physical reactions, keep the brain swappable, and resist rebuilding v1's
companion *platform* (provider hot-swap, episodic memory, proactive engine, persona
marketplace). The genuinely exciting part — wiring Echo to a real personal assistant
so the robot becomes its voice in the room — comes *after* the public MVP.

### What v1 got wrong (and v2 fixes)

v1 buried the movement under provider/memory/persona machinery. v2 inverts that:
the robot's reaction is the signature, the conversation is one clean loop, and the
brain is an interface so the product can grow without a rewrite.

---

## Design principles

1. **Embodiment first.** The robot's reaction is the signature, not the text.
2. **Pluggable brain.** The conversation backend is one interface, swapped by
   config. The app never hard-codes a provider or a model.
3. **Extensible seam, baked in from day one.** The same interface that serves the
   POC chatbot is what a personal-assistant backend plugs into later. Concrete
   wiring (endpoints, keys, agent commands) lives in gitignored config, never in
   committed code.
4. **Third consumer of the shared layer.** Echo reuses the same `shared/`
   foundation as Focus Guardian and DJ Reactor (config / session / persistence /
   server / React Signal kit / emotion library / safe motion). The only genuinely
   new shared code is the brain interface (and, later, voice I/O).
5. **Gentle motion by default** — inherits the conservative self-collision
   envelopes from the DJ Reactor tuning (antennas are the main risk).

---

## The brain interface (the extensible seam)

Everything routes through one interface — `Brain.respond(text, history) -> Reply`.

| Brain | When | Role |
|-------|------|------|
| **LiteLLMBrain** | **POC (now)** | Talks to a configured conversational model through an OpenAI-compatible endpoint. The whole MVP runs on this. |
| **CommandBrain** | **Post-MVP** | Shells to a configured agent command (prompt on stdin → reply on stdout). The hook a personal-assistant backend plugs into. Generic — no agent specifics in the repo. |

The model and endpoint are config, not code. The committed app ships pointed at a
configurable endpoint; the operator supplies the model and credentials via
environment. A token-gated inbound channel (`POST /api/say`, off unless a token is
set) is reserved for the post-MVP phase, when the assistant agent pushes messages
to the robot.

---

## Architecture

```
shared/
  brain/                      # NEW — pluggable conversational backend
    base.py                   #   Brain protocol + Reply(text, emotion?)
    litellm.py                #   LiteLLMBrain (OpenAI-compatible chat) — the POC brain
    command.py                #   CommandBrain (agent hook) — post-MVP
    factory.py                #   build_brain(spec)
  voice/                      # NEW — staged for Phase 2 (STT in / TTS out)
  app/ reachy_utils/ vision/ audio/ ui/   # existing shared foundation

apps/echo/echo/
  config.py                   # EchoConfig — brain/voice spec, persona, ports
  persona.py                  # personality presets -> system prompt + emotion style
  conversation.py             # turn manager: history + brain call + emotion-from-reply
  session.py                  # ConversationSession state machine (idle/listening/thinking/speaking)
  feedback.py                 # event -> emotion cue (listening pose, thinking antennas, speaking nod)
  app.py                      # orchestrator: control loop + brain + (reserved) inbound channel
  _bootstrap.py
  web/                        # React panel (Signal kit) — chat + live "presence/mood" readout
```

Robot control stays Python (SDK requirement). The UI is React served by the Python
app on its port; the dashboard iframes it. The server reuses the shared `AppServer`
(FastAPI + WebSocket live-state + serve-React).

---

## Phases

### Phase 1 — Conversation bot (the public MVP)
- `Brain` interface in `shared/brain/` with `LiteLLMBrain`.
- Text conversation in the React panel; robot reacts physically per turn
  (listening pose, "thinking" antennas, speaking nod) via the emotion library +
  conservative motion.
- `ConversationSession` state machine; light per-session persistence.
- Pointed at a strong conversational model via the operator's endpoint.

### Phase 2 — Voice
- New `shared/voice/` (STT in, TTS out), the way DJ Reactor added `shared/audio/`.
  Turns Echo into a real talk-to-it companion.

### Phase 3 — Assistant bridge (the part we build together, post-MVP)
- `CommandBrain` wired to a personal assistant agent for "ask my assistant" turns;
  two-brain routing (fast model for banter, agent for tasks).
- Assistant → robot push via the gated inbound channel on the agent's own cadence,
  so the robot becomes the assistant's voice in the room.
- Memory / proactivity return here, driven by the real agent instead of canned
  triggers.

---

## Signature element

Designed in the UI phase (via the design skill, as with FG's Focus Signal ring and
DJ's Beat Spectrum): the robot's **presence / emotional state made visible** — a
"mood core" that shows listening / thinking / speaking and the current feeling,
fused with the robot face. A stranger should get *this thing is present and reacts
to me* in five seconds, not *this is a chat box*.

---

## Constraints

- **No private infrastructure in the committed tree.** No endpoints, keys, agent
  names, or absolute user paths in committed code. (History was scrubbed once;
  don't reintroduce.) Concrete wiring lives in the gitignored `CLAUDE.md` + env.
- **Robot safety.** Conservative motion envelopes by default; antennas are the main
  self-collision risk — keep their range small. 7V-5A supply required for motion.

---

## Open questions

1. Voice from the start, or text-first MVP then voice in Phase 2? (Plan assumes
   text-first — it keeps the POC small.)
2. How much of v1 (memory, proactive engine, personas) returns, and when? (Plan:
   Phase 3, behind the assistant agent — earned, not assumed.)

---

*"You talk to it, and it reacts with its whole body. Then we make it the voice of
something that already knows you."*
