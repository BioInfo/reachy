"""Tests for the shared voice layer — VAD, fallbacks, factory, and the loop.

Pure logic + mocks; no audio device, no robot, no network. Run from repo root:
  ./venv/bin/python -m pytest apps/echo/tests/test_voice.py
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

import shared.voice as V                                    # noqa: E402
from shared.voice.wake import AlwaysWake                    # noqa: E402


# --- VAD -------------------------------------------------------------------

def _energy_burst(rng, seconds=0.8, sr=16000):
    return 0.2 * rng.standard_normal(int(sr * seconds)).astype(np.float32)


def test_vad_captures_an_utterance_rms_path():
    sr = 16000
    rng = np.random.default_rng(0)
    seg = V.VADSegmenter(silence_ms=500, min_speech_ms=120)
    seg._vad = None  # force the deterministic RMS gate
    stream = np.concatenate(
        [np.zeros(int(sr * 0.4), np.float32), _energy_burst(rng), np.zeros(int(sr * 0.8), np.float32)]
    )
    utt = None
    for blk in np.array_split(stream, 60):
        utt = seg.push(blk, sr)
        if utt is not None:
            break
    assert utt is not None
    assert 0.7 < len(utt) / sr < 2.0  # ~burst + pre-roll, bounded


def test_vad_ignores_a_blip_shorter_than_min_speech():
    sr = 16000
    rng = np.random.default_rng(1)
    seg = V.VADSegmenter(silence_ms=400, min_speech_ms=400)
    seg._vad = None
    blip = np.concatenate(
        [np.zeros(int(sr * 0.3), np.float32), _energy_burst(rng, 0.05), np.zeros(int(sr * 0.6), np.float32)]
    )
    got = [seg.push(b, sr) for b in np.array_split(blip, 40)]
    assert all(g is None for g in got)  # too short to be a turn


def test_vad_reset_clears_listening():
    seg = V.VADSegmenter()
    seg._vad = None
    rng = np.random.default_rng(2)
    seg.push(_energy_burst(rng, 0.3), 16000)
    seg.reset()
    assert seg.listening is False


# --- fallbacks + factory ---------------------------------------------------

def test_silent_tts_and_null_stt_are_available():
    tts = V.build_tts({"kind": "silent"})
    stt = V.build_stt({"kind": "null"})
    assert tts.available and stt.available
    samples, rate = tts.synth("anything")
    assert len(samples) == 0 and rate > 0
    assert stt.transcribe(np.zeros(10, np.float32), 16000) == ""


def test_gateway_backends_need_config_to_be_available():
    assert V.build_tts({"kind": "gateway", "gateway": {}}).name == "silent"   # no url/model -> fallback
    assert V.build_stt({"kind": "gateway", "gateway": {}}).name == "null"
    tts = V.build_tts({"kind": "gateway", "gateway": {"base_url": "http://x/v1", "model": "kokoro"}})
    assert tts.name == "gateway-tts" and tts.available


def test_build_wake_falls_back_when_no_porcupine_key():
    w = V.build_wake({"kind": "porcupine", "porcupine": {"access_key": ""}})
    # No Picovoice key -> falls back: openWakeWord when its models are installed,
    # else AlwaysWake. Never a broken PorcupineWake; always usable.
    assert w.name in ("openwakeword", "always")
    assert w.available and w.frame_length > 0


# --- VoiceLoop conductor ---------------------------------------------------

class MockAudio:
    name = "mock"
    available = True
    input_rate = 16000
    output_rate = 24000

    def __init__(self):
        self.played = []
        self._rng = np.random.default_rng(7)

    def start(self):
        pass

    def stop(self):
        pass

    def read(self):
        return 0.2 * self._rng.standard_normal(1600).astype(np.float32)  # always energetic

    def play(self, samples, samplerate):
        self.played.append((len(samples), samplerate))


class FakeSTT:
    name = "fake-stt"
    available = True

    def transcribe(self, samples, samplerate):
        return "hello robot"


class FakeTTS:
    name = "fake-tts"
    available = True

    def synth(self, text):
        return np.ones(2400, dtype=np.float32) * 0.1, 24000


def test_voice_loop_runs_a_full_turn():
    audio = MockAudio()
    vad = V.VADSegmenter(silence_ms=300, min_speech_ms=120)
    vad._vad = None  # deterministic RMS capture on the mock noise
    events: list[str] = []
    replies: list[str] = []

    def respond(text):
        replies.append(text)
        return "hi there"

    loop = V.VoiceLoop(
        audio,
        respond=respond,
        wake=AlwaysWake(),
        vad=vad,
        stt=FakeSTT(),
        tts=FakeTTS(),
        on_event=lambda e, p: events.append(e),
    )
    loop.start()
    time.sleep(0.8)
    loop.stop()

    assert "wake" in events
    assert "transcript" in events
    assert "thinking" in events
    assert "speaking" in events
    assert "speaking_end" in events
    assert replies and replies[0] == "hello robot"   # STT text reached the responder
    assert audio.played and audio.played[0][1] == 24000  # TTS audio was spoken


def test_voice_loop_status_reports_capabilities():
    loop = V.VoiceLoop(MockAudio(), respond=lambda t: "", stt=FakeSTT(), tts=FakeTTS())
    st = loop.status()
    assert st["can_hear"] is True and st["can_speak"] is True
    assert st["state"] == "stopped"


def test_voice_loop_safe_with_all_fallbacks():
    """No real backends configured -> loop still starts/stops without raising."""
    loop = V.VoiceLoop(MockAudio(), respond=lambda t: "x")
    loop.start()
    time.sleep(0.2)
    loop.stop()
    assert loop.running is False
