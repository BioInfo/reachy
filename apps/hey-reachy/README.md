---
title: "Hey, Reachy"
emoji: "🎙️"
colorFrom: indigo
colorTo: blue
sdk: static
pinned: false
license: mit
short_description: "Say hi to your Reachy Mini and it talks back, out loud"
tags:
  - reachy_mini
  - reachy_mini_python_app
  - voice
  - conversation
  - assistant
---

# Hey, Reachy

A voice companion for Reachy Mini. Say a wake word, talk, and the robot talks back,
all out of its own speaker. It listens, thinks, replies in a natural spoken voice,
and nods gently while it speaks. The robot's reaction is the product; the language
model behind it is just the engine, and it is swappable.

## How it works

```
wake word  ->  listen (VAD)  ->  transcribe (STT)  ->  brain (LLM)  ->  speak (TTS)  ->  nod
```

1. **Wake**: an open-source, keyless wake word (openWakeWord) wakes the robot. No
   cloud, no account.
2. **Listen**: voice-activity detection captures your utterance and stops on silence.
3. **Transcribe**: speech to text through an OpenAI-compatible endpoint.
4. **Think**: a pluggable brain returns a short, spoken-style reply.
5. **Speak**: text to speech, played from the robot's own speaker.
6. **React**: a small, slow head-nod while speaking. It holds still otherwise, no
   fidgeting.

After it replies it keeps listening for a few seconds so you can have a back-and-forth
without re-waking it. Quiet for long enough and it goes back to waiting.

## The brain is pluggable

Conversation runs through one interface: `Brain.respond(text, history) -> Reply`.
The default is `LiteLLMBrain`, which talks to any OpenAI-compatible chat endpoint, so
you point it at whatever model server you run. A `CommandBrain` is included for wiring
in your own agent (it shells out to a command, prompt on stdin, reply on stdout).

Speech in and speech out are also OpenAI-compatible endpoints, so one gateway can
serve chat, text-to-speech, and transcription with a single key.

## Configuration

Everything is environment-driven. Nothing is hardcoded.

```bash
# the brain (any OpenAI-compatible chat endpoint)
export HEY_REACHY_LLM_BASE_URL=http://your-gateway:4000/v1
export HEY_REACHY_LLM_MODEL=your-model-id
export HEY_REACHY_LLM_API_KEY=your-key

# speech (default to the same endpoint as the brain)
export HEY_REACHY_TTS_MODEL=kokoro
export HEY_REACHY_STT_MODEL=faster-whisper

# wake word (openWakeWord presets: hey_jarvis | alexa | hey_mycroft | hey_rhasspy)
export HEY_REACHY_OPENWW_MODEL=hey_jarvis
export HEY_REACHY_WAKE_THRESHOLD=0.4
```

> Wake word note: the keyless presets above are what ship today. A custom "Hey,
> Reachy" wake model is straightforward to train with openWakeWord and is on the
> roadmap. Until then, pick the preset that triggers most reliably for you.

## Running

With the Reachy Mini daemon running on port 8000:

```bash
pip install -e .
# start it from the dashboard, or:
curl -X POST http://127.0.0.1:8000/api/apps/start-app/hey_reachy
```

A status panel is served on the app's UI port (`HEY_REACHY_UI_PORT`, default 7863).
Set `HEY_REACHY_VOICE=0` (or `HEY_REACHY_MEDIA_BACKEND=no_media`) to run it mute for a
dry start.

## Architecture

Hey, Reachy is built on a small shared layer reused across this project's apps:

- `shared/voice/` — wake, VAD, STT, TTS, the robot audio link, and the `VoiceLoop`
  that conducts a turn.
- `shared/brain/` — the pluggable brain (`LiteLLMBrain`, `CommandBrain`).
- `shared/app/` — the FastAPI status server and config helpers.

The app itself is thin: a config, a conversation manager, and an orchestrator that
owns robot motion on one thread while the voice loop runs on another.

## Safety

Conservative motion by design. While speaking it does a small, slow head-nod with the
antennas pinned (the antennas are the self-collision risk). It holds a calm neutral
pose the rest of the time. Motion needs the 7V-5A supply; on USB alone the app runs
but the robot will not move.

## License

MIT. Part of a build-in-public Reachy Mini project: https://runreachyrun.com
