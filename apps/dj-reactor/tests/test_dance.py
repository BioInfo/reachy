"""Pure-logic tests for the DJ Reactor v2 core (no robot, no audio device).

Covers the FFT analyzer (synthetic samples), the dance controller (bounded
motion), the set state machine (events), config (env/overrides/clamp), and
history roundtrip. Mirrors Focus Guardian's test style.
"""

import sys
from pathlib import Path

import numpy as np

# make repo `shared` and the app package importable when run directly
_here = Path(__file__).resolve()
for p in _here.parents:
    if (p / "shared" / "__init__.py").exists():
        sys.path.insert(0, str(p))
        break
sys.path.insert(0, str(_here.parents[1]))  # apps/dj-reactor

from shared.audio import FFTBeatAnalyzer, AudioFeatures, build_audio_source, SilentAudioSource  # noqa: E402
from dj_reactor.genres import get_preset, GENRE_PRESETS, DEFAULT_GENRE  # noqa: E402
from dj_reactor.dance import DanceController, Movement, BODY_YAW_MAX, HEAD_PITCH_MAX  # noqa: E402
from dj_reactor.session import DJSession, DJState, DJEvent  # noqa: E402
from dj_reactor.config import DJConfig  # noqa: E402
from dj_reactor.persistence import DJHistory  # noqa: E402


def _tone(freq, sr=44100, n=2048, amp=0.5):
    t = np.arange(n) / sr
    return amp * np.sin(2 * np.pi * freq * t)


# -- analyzer ---------------------------------------------------------------

def test_bands_separate_by_frequency():
    ana = FFTBeatAnalyzer(sample_rate=44100, chunk_size=2048)
    bass = ana.process(_tone(120), 0.0)
    assert bass.bass > 0.8 and bass.treble < 0.1
    treble = ana.process(_tone(6000), 0.1)
    assert treble.treble > 0.8 and treble.bass < 0.1


def test_silence_detected():
    ana = FFTBeatAnalyzer()
    f = ana.process(np.zeros(2048), 0.0)
    assert f.is_silent
    assert f.rms == 0.0


def test_beat_detected_on_energy_jump():
    ana = FFTBeatAnalyzer(sensitivity=0.9)
    # quiet frames build the energy history, then a loud onset
    for i in range(4):
        ana.process(_tone(120, amp=0.01), i * 0.3)
    loud = ana.process(_tone(120, amp=0.6), 4 * 0.3)
    assert loud.beat_detected
    assert loud.onset_strength > 1.0


# -- dance controller -------------------------------------------------------

def test_movement_bounded_and_headbang_pitches_down():
    dc = DanceController(get_preset("rock"), intensity=1.0)
    f = AudioFeatures(bass=1.0, mid=1.0, treble=1.0, rms=1.0, beat_detected=True,
                      onset_strength=2.0, bpm=140, beat_phase=0.3, is_silent=False)
    m = None
    for _ in range(6):
        m = dc.compute(f, dt=0.1)
    assert abs(m.body_yaw) <= BODY_YAW_MAX
    assert abs(m.head_pitch) <= HEAD_PITCH_MAX
    assert -1.0 <= m.antenna_left <= 1.0
    assert m.head_pitch < 0  # headbang nods down on the beat


def test_no_beat_no_pitch_kick():
    dc = DanceController(get_preset("jazz"), intensity=0.5)
    f = AudioFeatures(bass=0.3, mid=0.3, treble=0.3, rms=0.3, beat_detected=False,
                      bpm=110, beat_phase=0.5, is_silent=False)
    m = dc.compute(f, dt=0.1)
    assert m.head_pitch == 0.0


# -- session ----------------------------------------------------------------

def _silent():
    return AudioFeatures(is_silent=True)


def _music(onset=1.0, beat=True):
    return AudioFeatures(bass=0.7, rms=0.5, beat_detected=beat, onset_strength=onset,
                         bpm=124, is_silent=False)


def test_idle_until_started():
    s = DJSession()
    assert s.state == DJState.IDLE
    assert s.tick(0.1, _music()) == []  # nothing before start


def test_music_start_and_pause():
    s = DJSession(silence_pause_s=1.0)
    s.start()
    assert s.state == DJState.LISTENING
    assert DJEvent.MUSIC_STARTED in s.tick(0.1, _music())
    assert s.state == DJState.VIBING
    # sustained silence -> pause
    evs = []
    for _ in range(12):
        evs += s.tick(0.1, _silent())
    assert DJEvent.MUSIC_PAUSED in evs
    assert s.state == DJState.LISTENING


def test_drop_respects_cooldown():
    s = DJSession(drop_onset_threshold=1.7, drop_cooldown_s=2.0)
    s.start()
    s.tick(0.1, _music())  # start vibing
    assert DJEvent.DROP in s.tick(0.1, _music(onset=1.9))
    # immediate second big onset is within cooldown -> no drop
    assert DJEvent.DROP not in s.tick(0.1, _music(onset=1.9))
    # wait out the cooldown -> drop again
    evs = []
    for _ in range(22):
        evs += s.tick(0.1, _music(onset=1.9))
    assert DJEvent.DROP in evs
    assert s.drops >= 2


def test_set_end_and_stats():
    s = DJSession()
    s.start()
    for _ in range(30):
        s.tick(0.1, _music())
    st = s.stats()
    assert st.vibing_s > 2.5
    assert st.beats > 0
    assert st.peak_bpm == 124
    assert DJEvent.SET_ENDED in s.stop()
    assert s.state == DJState.IDLE


# -- config -----------------------------------------------------------------

def test_config_env_and_overrides():
    import os
    os.environ["DJ_GENRE"] = "rock"
    os.environ["DJ_SOUND_ENABLED"] = "false"
    os.environ["DJ_INTENSITY"] = "0.9"
    cfg = DJConfig.from_env()
    assert cfg.genre == "rock"
    assert cfg.sound_enabled is False
    assert cfg.intensity == 0.9
    assert cfg.preset().name == "rock"
    # overrides only touch allowed fields and clamp
    cfg.apply_overrides(intensity=5.0, ui_port=9999, genre="jazz")
    assert cfg.intensity == 1.0          # clamped
    assert cfg.genre == "jazz"
    assert cfg.ui_port == 7861           # not in allowed set
    del os.environ["DJ_GENRE"], os.environ["DJ_SOUND_ENABLED"], os.environ["DJ_INTENSITY"]


def test_get_preset_falls_back():
    assert get_preset("does-not-exist").name == DEFAULT_GENRE


def test_silent_source_is_safe():
    src = build_audio_source({"kind": "silent"})
    assert isinstance(src, SilentAudioSource)
    assert src.available is False
    assert src.start() is False
    assert src.latest().is_silent


# -- persistence ------------------------------------------------------------

def test_history_roundtrip(tmp_path):
    h = DJHistory(tmp_path / "history.jsonl")
    s = DJSession()
    s.start()
    for _ in range(40):
        s.tick(0.1, _music())
    h.record(s.stats(), genre="rock")
    h.record(s.stats(), genre="jazz")
    totals = h.totals()
    assert totals["sets"] == 2
    assert totals["beats"] > 0
    assert totals["peak_bpm"] == 124
    daily = h.daily()
    assert len(daily) == 1
    (day,) = daily.values()
    assert day["sets"] == 2
