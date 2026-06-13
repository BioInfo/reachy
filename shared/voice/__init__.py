"""Pluggable voice layer for Reachy apps — ears + a mouth around the brain.

Light on import: base types, the VAD, the loop, and the factories. The concrete
backends (and their deps — openai, sounddevice, pvporcupine, openwakeword) load
lazily inside the builders, so pure-logic code can `import shared.voice` without
pulling audio stacks.

Wiring (see app code):

    audio = RobotAudioIO(robot)            # or LocalAudioIO() with no robot
    tts   = build_tts(cfg.tts_spec())      # Kokoro behind the gateway
    stt   = build_stt(cfg.stt_spec())      # faster-whisper behind the gateway
    wake  = build_wake(cfg.wake_spec())    # "Hey Echo" (Porcupine) or fallback
    loop  = VoiceLoop(audio, respond=brain_respond, wake=wake, stt=stt, tts=tts,
                      on_event=on_voice_event)
    loop.start()
"""

from __future__ import annotations

from .audio_io import AudioIO, LocalAudioIO, RobotAudioIO
from .base import (
    STT_SAMPLE_RATE,
    STTEngine,
    TTSEngine,
    Utterance,
    WakeWord,
    resample,
    to_int16,
)
from .factory import build_stt, build_tts, build_vad, build_wake
from .pipeline import EventHandler, Responder, VoiceLoop, VoiceState
from .vad import VADSegmenter

__all__ = [
    # protocols / types
    "TTSEngine",
    "STTEngine",
    "WakeWord",
    "AudioIO",
    "Utterance",
    "VoiceState",
    "EventHandler",
    "Responder",
    "STT_SAMPLE_RATE",
    # concrete
    "RobotAudioIO",
    "LocalAudioIO",
    "VADSegmenter",
    "VoiceLoop",
    # factories
    "build_tts",
    "build_stt",
    "build_wake",
    "build_vad",
    # helpers
    "resample",
    "to_int16",
]
