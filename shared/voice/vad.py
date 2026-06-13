"""Voice-activity detection — find where one spoken turn starts and ends.

After the wake word fires, we record until the speaker stops. A fixed timeout is
crude (cuts people off or waits too long); VAD watches the energy/voicedness of
the stream and ends the utterance when it hears trailing silence. WebRTC's VAD is
the workhorse: tiny, fast, robust, used everywhere.

`VADSegmenter` is fed mono float32 chunks at any samplerate. It resamples to the
16 kHz / 30 ms frames WebRTC wants, tracks speech vs silence, and returns the
captured utterance (16 kHz mono float32) once the turn completes — or None while
it's still listening. It bounds the utterance so a noisy room can't record
forever, and ignores blips shorter than `min_speech_ms` so a cough isn't a turn.

Degrades gracefully: with no `webrtcvad` installed it falls back to a simple RMS
energy gate, so the loop still segments (less precisely) rather than failing.
"""

from __future__ import annotations

import logging

import numpy as np

from .base import STT_SAMPLE_RATE, resample, to_int16

logger = logging.getLogger(__name__)

_FRAME_MS = 30
_FRAME_LEN = STT_SAMPLE_RATE * _FRAME_MS // 1000  # 480 samples @ 16 kHz


class VADSegmenter:
    """Streaming utterance segmenter (WebRTC VAD, RMS fallback)."""

    def __init__(
        self,
        *,
        aggressiveness: int = 2,
        silence_ms: int = 700,
        min_speech_ms: int = 200,
        max_utterance_s: float = 12.0,
        pre_roll_ms: int = 150,
        rms_threshold: float = 0.012,
    ):
        self.silence_frames = max(1, silence_ms // _FRAME_MS)
        self.min_speech_frames = max(1, min_speech_ms // _FRAME_MS)
        self.max_frames = int(max_utterance_s * 1000 // _FRAME_MS)
        self.pre_roll_frames = max(0, pre_roll_ms // _FRAME_MS)
        self.rms_threshold = rms_threshold
        self._vad = self._make_vad(aggressiveness)
        self._buf = np.zeros(0, dtype=np.float32)  # leftover sub-frame samples
        self.reset()

    @staticmethod
    def _make_vad(aggressiveness: int):
        try:
            import webrtcvad

            return webrtcvad.Vad(max(0, min(3, aggressiveness)))
        except Exception:  # noqa: BLE001
            logger.info("webrtcvad unavailable — using RMS energy gate")
            return None

    def reset(self) -> None:
        """Drop all state; ready for a fresh utterance."""
        self._frames: list[np.ndarray] = []   # 480-sample float32 frames kept
        self._pre: list[np.ndarray] = []       # rolling pre-roll before speech
        self._in_speech = False
        self._speech_run = 0
        self._silence_run = 0
        self._buf = np.zeros(0, dtype=np.float32)

    def _is_speech(self, frame: np.ndarray) -> bool:
        if self._vad is not None:
            try:
                return self._vad.is_speech(to_int16(frame).tobytes(), STT_SAMPLE_RATE)
            except Exception:  # noqa: BLE001
                pass
        return float(np.sqrt(np.mean(frame.astype(np.float64) ** 2))) > self.rms_threshold

    def push(self, chunk: np.ndarray, samplerate: int) -> np.ndarray | None:
        """Feed a mono float32 chunk. Returns the utterance when the turn ends.

        The utterance is 16 kHz mono float32 including a short pre-roll so the
        first syllable isn't clipped. Returns None while still listening.
        """
        if chunk is None or len(chunk) == 0:
            return None
        s = resample(np.asarray(chunk, dtype=np.float32), samplerate, STT_SAMPLE_RATE)
        self._buf = np.concatenate([self._buf, s]) if self._buf.size else s

        n = (len(self._buf) // _FRAME_LEN) * _FRAME_LEN
        frames, self._buf = self._buf[:n], self._buf[n:]

        for i in range(0, n, _FRAME_LEN):
            frame = frames[i : i + _FRAME_LEN]
            voiced = self._is_speech(frame)

            if not self._in_speech:
                self._pre.append(frame)
                if len(self._pre) > self.pre_roll_frames:
                    self._pre.pop(0)
                if voiced:
                    self._speech_run += 1
                    if self._speech_run >= self.min_speech_frames:
                        self._in_speech = True
                        self._frames = list(self._pre)  # seed with pre-roll
                        self._silence_run = 0
                else:
                    self._speech_run = 0
                continue

            # in speech: collect, watch for trailing silence or overflow
            self._frames.append(frame)
            self._silence_run = self._silence_run + 1 if not voiced else 0
            if self._silence_run >= self.silence_frames or len(self._frames) >= self.max_frames:
                utt = np.concatenate(self._frames) if self._frames else np.zeros(0, dtype=np.float32)
                self.reset()
                return utt.astype(np.float32)
        return None

    @property
    def listening(self) -> bool:
        """True once speech has started and we're capturing."""
        return self._in_speech
