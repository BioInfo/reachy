"""Shared audio utilities for Reachy Mini apps.

Pluggable, mirroring `vision/`:
- `AudioFeatures` + `AudioSource` protocol (`base`)
- `FFTBeatAnalyzer` — pure FFT band + beat/BPM core (`analyzer`)
- `MicAudioSource` — live capture via sounddevice, degrades clean (`capture`)
- `SilentAudioSource` — no-device fallback (`base`)
- `build_audio_source(spec)` — pick a source from config (`factory`)
"""

from .base import AudioFeatures, AudioSource, SilentAudioSource
from .analyzer import FFTBeatAnalyzer, BASS_RANGE, MID_RANGE, TREBLE_RANGE
from .capture import MicAudioSource, list_input_devices, sounddevice_available
from .factory import build_audio_source

__all__ = [
    "AudioFeatures",
    "AudioSource",
    "SilentAudioSource",
    "FFTBeatAnalyzer",
    "BASS_RANGE",
    "MID_RANGE",
    "TREBLE_RANGE",
    "MicAudioSource",
    "list_input_devices",
    "sounddevice_available",
    "build_audio_source",
]
