"""Speech-to-text — the robot's ears.

The captured utterance (mono float32 from the VAD) is transcribed through an
OpenAI-compatible `/v1/audio/transcriptions` endpoint (faster-whisper behind the
gateway). We wrap the samples in an in-memory wav and post them as a file, which
is exactly what the OpenAI client expects, so no temp files touch disk.

`transcribe(samples, samplerate)` returns the recognized text, or "" on silence/
failure. `NullSTT` is the fallback that always returns "" so an app without an STT
endpoint stays importable and the loop simply hears nothing.
"""

from __future__ import annotations

import io
import json
import logging
from typing import Any

import numpy as np

from .base import STT_SAMPLE_RATE, resample, to_int16

logger = logging.getLogger(__name__)


def _wav_bytes(samples: np.ndarray, samplerate: int) -> bytes:
    """Mono float32 -> 16-bit PCM wav bytes (stdlib, no soundfile dependency)."""
    import wave

    pcm = to_int16(samples)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(int(samplerate))
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


class GatewaySTT:
    """OpenAI-compatible STT (faster-whisper behind the LiteLLM gateway)."""

    name = "gateway-stt"

    def __init__(
        self,
        base_url: str = "",
        api_key: str = "",
        model: str = "",
        *,
        language: str = "en",
        timeout: float = 30.0,
        target_rate: int = STT_SAMPLE_RATE,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._api_key = api_key
        self.model = model
        self.language = language
        self.timeout = timeout
        self.target_rate = target_rate
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

    def transcribe(self, samples: np.ndarray, samplerate: int) -> str:
        if samples is None or len(samples) == 0 or not self.available:
            return ""
        data = resample(np.asarray(samples, dtype=np.float32), samplerate, self.target_rate)
        wav = _wav_bytes(data, self.target_rate)
        try:
            client = self._ensure_client()
            kwargs: dict[str, Any] = {
                "model": self.model,
                "file": ("utterance.wav", wav, "audio/wav"),
                # json (not text): the LiteLLM gateway always returns a JSON body,
                # so "text" hands back the raw {"text": ...} blob as a string.
                "response_format": "json",
            }
            if self.language:
                kwargs["language"] = self.language
            resp = client.audio.transcriptions.create(**kwargs)
            text = resp if isinstance(resp, str) else getattr(resp, "text", "")
            text = (text or "").strip()
            # defensive: some gateways still hand back a JSON string here — unwrap it.
            if text.startswith("{") and '"text"' in text:
                try:
                    text = (json.loads(text).get("text") or "").strip()
                except (ValueError, TypeError):
                    pass
            return text
        except Exception as exc:  # noqa: BLE001 — a failed transcription is just silence
            logger.warning("GatewaySTT transcribe failed: %s", exc)
            return ""


class NullSTT:
    """No-op STT: reports available, always returns "". Keeps the app runnable."""

    name = "null"
    available = True

    def transcribe(self, samples: np.ndarray, samplerate: int) -> str:  # noqa: ARG002
        return ""
