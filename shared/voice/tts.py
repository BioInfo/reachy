"""Text-to-speech — the robot's voice.

The POC speaks through an OpenAI-compatible `/v1/audio/speech` endpoint (a Kokoro
server behind the gateway), the same shape as the brain's chat endpoint: a base
URL + model + voice + key, all from config. Keeping it OpenAI-compatible means the
backend is swappable (Kokoro now, something else later) without touching the loop.

`synth(text)` returns `(mono float32 in [-1,1], samplerate)` so `audio_io.play`
can push it to the speaker. We request a lossless `wav` and decode it locally,
which avoids a hard dependency on an mp3 decoder and keeps the samples exact.

`SilentTTS` is the graceful fallback: it "succeeds" with empty audio so an app
without a TTS endpoint stays runnable (the text still shows in the UI).
"""

from __future__ import annotations

import io
import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# Kokoro serves 24 kHz; used only as a fallback if the wav header is unreadable.
_FALLBACK_RATE = 24000


def _decode_wav(data: bytes) -> tuple[np.ndarray, int]:
    """Decode wav bytes -> (mono float32, samplerate). Prefers soundfile."""
    try:
        import soundfile as sf

        samples, rate = sf.read(io.BytesIO(data), dtype="float32", always_2d=False)
        if samples.ndim > 1:
            samples = samples.mean(axis=1)
        return samples.astype(np.float32), int(rate)
    except Exception:  # noqa: BLE001 — fall back to the stdlib wave reader
        import wave

        with wave.open(io.BytesIO(data), "rb") as w:
            rate = w.getframerate()
            n = w.getnframes()
            raw = w.readframes(n)
            ch = w.getnchannels()
        arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if ch > 1:
            arr = arr.reshape(-1, ch).mean(axis=1)
        return arr, int(rate)


class GatewayTTS:
    """OpenAI-compatible TTS (Kokoro behind the LiteLLM gateway)."""

    name = "gateway-tts"

    def __init__(
        self,
        base_url: str = "",
        api_key: str = "",
        model: str = "",
        *,
        voice: str = "af_heart",
        response_format: str = "wav",
        speed: float = 1.0,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._api_key = api_key
        self.model = model
        self.voice = voice
        self.response_format = response_format
        self.speed = speed
        self.timeout = timeout
        self._client: Any = None

    @property
    def available(self) -> bool:
        return bool(self.base_url and self.model)

    def _ensure_client(self) -> Any:
        if self._client is None:
            from openai import OpenAI

            self._client = OpenAI(
                base_url=self.base_url,
                api_key=self._api_key or "not-needed",
                timeout=self.timeout,
            )
        return self._client

    def synth(self, text: str) -> tuple[np.ndarray, int]:
        text = (text or "").strip()
        if not text or not self.available:
            return np.zeros(0, dtype=np.float32), _FALLBACK_RATE
        try:
            client = self._ensure_client()
            resp = client.audio.speech.create(
                model=self.model,
                voice=self.voice,
                input=text,
                response_format=self.response_format,
                speed=self.speed,
            )
            data = resp.read()
            return _decode_wav(data)
        except Exception as exc:  # noqa: BLE001 — never break the loop over a bad synth
            logger.warning("GatewayTTS synth failed: %s", exc)
            return np.zeros(0, dtype=np.float32), _FALLBACK_RATE


class SilentTTS:
    """No-op TTS: reports available, returns empty audio. Keeps the app runnable."""

    name = "silent"
    available = True

    def synth(self, text: str) -> tuple[np.ndarray, int]:  # noqa: ARG002
        return np.zeros(0, dtype=np.float32), _FALLBACK_RATE
