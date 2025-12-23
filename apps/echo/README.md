---
title: Reachy Echo
emoji: "🤖"
colorFrom: indigo
colorTo: purple
sdk: static
pinned: false
license: mit
tags:
  - reachy_mini
  - reachy_mini_python_app
  - companion
  - memory
  - ai
---

# Reachy Echo

A companion robot that remembers you and grows with you.

## What Makes Echo Different

Most robot apps treat the robot as a voice interface with decorative movement. Echo is different:

| Feature | Traditional | Echo |
|---------|-------------|------|
| **Memory** | Forgets everything | Remembers your name, preferences, conversations |
| **Initiative** | Waits for commands | Greets you, suggests breaks, celebrates wins |
| **Models** | Single provider | 18+ models via LiteLLM (swap anytime) |
| **Movement** | Decorative | Communicates emotion and state |

## Quick Start

### Install

```bash
cd ~/apps/reachy/apps/echo
pip install -e .
```

### Run (Simulation Mode)

```bash
python -m reachy_mini_echo --sim
```

Open http://localhost:7861

### Run (Real Robot)

With the Reachy daemon running:
- Echo appears in the Reachy Mini dashboard
- Or access directly at http://localhost:7861

## Features

### Memory System

Echo remembers across sessions:
- Your name and preferences
- Past conversations and topics
- Work patterns and habits

Try saying:
- "My name is Justin"
- "I work at AstraZeneca"
- "What do you know about me?"

### Proactive Behaviors

| Behavior | What it does | When |
|----------|--------------|------|
| **Morning Greeting** | Personalized hello | First appearance, 6-11am |
| **Work Break Reminder** | Suggests a stretch | After 2 hours of work |
| **Build Celebration** | Excited dance | When your code builds |
| **Build Support** | Sympathetic response | When builds fail |
| **Return Greeting** | Welcome back | After 30+ min absence |

### Model Selection

Switch between 18+ models instantly:

| Model | Best for |
|-------|----------|
| `llama-3.3-70b-cerebras` | Fast local inference (default) |
| `claude-opus-4.5-openrouter` | Most capable |
| `gpt-5.2-openrouter` | Latest GPT |
| `gemini-3-pro-openrouter` | Multimodal |
| `qwen-3-235b-cerebras` | Large context |

## Configuration

Environment variables (optional):

```bash
# LiteLLM server (defaults to DGX)
export LITELLM_URL=http://your-litellm-server:4000
export LITELLM_API_KEY=your-key

# Default model
export LITELLM_MODEL=llama-3.3-70b-cerebras
```

## UI Overview

```
┌─────────────────────────────────────────────────────┐
│  🤖 Reachy Echo                                     │
│  A companion that remembers you and grows with you  │
├─────────────────────────────┬───────────────────────┤
│                             │ Status: 🟢 Connected  │
│  Conversation               │                       │
│  ─────────────              │ Model: [dropdown]     │
│  User: Hi there!            │                       │
│  Echo: Hello! How are you?  │ Memory:               │
│                             │ Facts: 3 | Sessions: 5│
│                             │                       │
│  [Type a message...]  [Send]│ Proactive Behaviors:  │
│                             │ ☑ Morning Greeting    │
│                             │ ☑ Work Break Reminder │
│                             │ ☑ Build Celebration   │
│                             │                       │
│                             │ [Clear] [Forget Me]   │
└─────────────────────────────┴───────────────────────┘
```

## Architecture

```
reachy_mini_echo/
├── main.py           # ReachyMiniEcho app class
├── providers/        # LLM backends (LiteLLM)
├── memory/           # SQLite + fact extraction
└── proactive/        # Trigger/behavior engine
```

## Development

See `CLAUDE.md` for detailed architecture and development guide.

### Adding Behaviors

1. Create behavior class in `proactive/behaviors.py`
2. Implement `execute(echo)` method
3. Create trigger in `proactive/triggers.py`
4. Register in `proactive/engine.py`

### Memory Fact Extraction

Echo automatically extracts facts from conversation:
- "My name is X" → stores name
- "I prefer X" → stores preference
- "I work at X" → stores employer

## Privacy

- All data stored locally in `data/memory.db`
- "Forget Me" button clears personal data
- No cloud storage of conversations
- Local models available for full privacy

## License

MIT
