"""EchoConfig — every Echo tunable in one place.

Same pattern as DJConfig / FocusConfig: each field is env-overridable (ECHO_*),
the brain is built from `brain_spec()`, and secrets (api key, inbound token) are
kept out of `public_dict()` so they never reach the UI.

The POC runs on the `litellm` brain (an OpenAI-compatible endpoint). The
`command` brain + the inbound channel are reserved for the post-MVP assistant
bridge; their fields exist here but default off.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from shared.app.config import (
    BaseAppConfig, app_data_dir, env_str, env_int, env_float, env_bool,
)

APP_NAME = "echo"

# Echo's personality. The app owns the persona; the brain just carries it.
DEFAULT_PERSONA = (
    "You are Echo, a small desk robot with a warm, curious personality. "
    "Keep replies short and spoken-aloud natural — a sentence or two, not an essay. "
    "You have a physical body (a head and antennas) and you're talking with someone "
    "at their desk. Be friendly and present, never robotic or listy. "
    "Everything you write is spoken aloud by a text-to-speech voice, so output ONLY "
    "the words you would say. Never narrate actions, emotions, or stage directions: "
    "no asterisks like *tilts head* or *antennas wiggle*, no parenthetical actions, "
    "no emoji. Just speak."
)


@dataclass
class EchoConfig(BaseAppConfig):
    app_name: str = APP_NAME

    # brain selection
    brain_kind: str = "litellm"          # litellm (POC) | command (post-MVP)

    # litellm brain (OpenAI-compatible endpoint)
    llm_base_url: str = ""               # e.g. http://<gateway>:4000/v1
    llm_model: str = ""                  # e.g. the conversational model id
    llm_api_key: str = ""                # SECRET — never in public_dict
    temperature: float = 0.7
    max_tokens: int = 512
    request_timeout_s: float = 30.0
    max_history: int = 20                # turns of context sent to the model
    persona: str = DEFAULT_PERSONA
    reasoning_enabled: bool = False      # OFF by default: voice wants snappy, short replies

    # voice (the POC loop): wake -> VAD -> STT -> brain -> TTS -> speaker.
    # TTS/STT default to the SAME gateway as the brain (llm_base_url + llm_api_key),
    # so one gateway + one vk-echo key serves chat + kokoro + faster-whisper.
    voice_enabled: bool = True
    media_backend: str = "default"       # ReachyMini media (audio in/out); "no_media" disables voice
    tts_base_url: str = ""               # default -> llm_base_url
    tts_api_key: str = ""                # default -> llm_api_key (SECRET)
    tts_model: str = "kokoro"
    tts_voice: str = "af_heart"
    tts_speed: float = 1.0
    stt_base_url: str = ""               # default -> llm_base_url
    stt_api_key: str = ""                # default -> llm_api_key (SECRET)
    stt_model: str = "faster-whisper"
    stt_language: str = "en"
    wake_kind: str = "always"            # always | openwakeword | porcupine
    porcupine_access_key: str = ""       # SECRET — Picovoice AccessKey (free)
    porcupine_keyword_path: str = ""     # path to a custom .ppn (optional)
    porcupine_builtin: str = "computer"  # built-in keyword (no .ppn needed): computer|jarvis|
                                         # picovoice|bumblebee|terminator|grasshopper|blueberry...
    openww_model: str = "hey_jarvis"     # keyless fallback wake model (needs onnx/tflite models)
    wake_threshold: float = 0.4          # openWakeWord detection threshold (lower = more sensitive)
    require_wake: bool = True            # don't always-listen without a real wake word
    vad_silence_ms: int = 700
    vad_min_speech_ms: int = 250
    listen_timeout_s: float = 10.0      # first turn after the wake word
    follow_up_timeout_s: float = 8.0    # follow-up turns (conversation, no re-wake)

    # command brain (post-MVP agent hook)
    agent_cmd: str = ""                  # ECHO_AGENT_CMD; empty = disabled
    agent_timeout_s: float = 120.0

    # inbound push channel (post-MVP; off unless a token is set)
    inbound_token: str = ""              # SECRET — never in public_dict

    # loop / server
    tick_hz: float = 8.0                 # idle-motion update rate
    ui_port: int = 7863

    @classmethod
    def from_env(cls) -> "EchoConfig":
        return cls(
            brain_kind=env_str("ECHO_BRAIN", "litellm"),
            llm_base_url=env_str("ECHO_LLM_BASE_URL", ""),
            llm_model=env_str("ECHO_LLM_MODEL", ""),
            llm_api_key=env_str("ECHO_LLM_API_KEY", ""),
            temperature=env_float("ECHO_TEMPERATURE", 0.7),
            max_tokens=env_int("ECHO_MAX_TOKENS", 512),
            request_timeout_s=env_float("ECHO_REQUEST_TIMEOUT_S", 30.0),
            max_history=env_int("ECHO_MAX_HISTORY", 20),
            persona=env_str("ECHO_PERSONA", DEFAULT_PERSONA),
            reasoning_enabled=env_bool("ECHO_REASONING", False),
            voice_enabled=env_bool("ECHO_VOICE", True),
            media_backend=env_str("ECHO_MEDIA_BACKEND", "default"),
            tts_base_url=env_str("ECHO_TTS_BASE_URL", ""),
            tts_api_key=env_str("ECHO_TTS_API_KEY", ""),
            tts_model=env_str("ECHO_TTS_MODEL", "kokoro"),
            tts_voice=env_str("ECHO_TTS_VOICE", "af_heart"),
            tts_speed=env_float("ECHO_TTS_SPEED", 1.0),
            stt_base_url=env_str("ECHO_STT_BASE_URL", ""),
            stt_api_key=env_str("ECHO_STT_API_KEY", ""),
            stt_model=env_str("ECHO_STT_MODEL", "faster-whisper"),
            stt_language=env_str("ECHO_STT_LANGUAGE", "en"),
            wake_kind=env_str("ECHO_WAKE", "always"),
            porcupine_access_key=env_str("ECHO_PORCUPINE_KEY", ""),
            porcupine_keyword_path=env_str("ECHO_PORCUPINE_PPN", ""),
            porcupine_builtin=env_str("ECHO_PORCUPINE_BUILTIN", "computer"),
            openww_model=env_str("ECHO_OPENWW_MODEL", "hey_jarvis"),
            wake_threshold=env_float("ECHO_WAKE_THRESHOLD", 0.4),
            require_wake=env_bool("ECHO_REQUIRE_WAKE", True),
            vad_silence_ms=env_int("ECHO_VAD_SILENCE_MS", 700),
            vad_min_speech_ms=env_int("ECHO_VAD_MIN_SPEECH_MS", 250),
            listen_timeout_s=env_float("ECHO_LISTEN_TIMEOUT_S", 10.0),
            follow_up_timeout_s=env_float("ECHO_FOLLOW_UP_TIMEOUT_S", 8.0),
            agent_cmd=env_str("ECHO_AGENT_CMD", ""),
            agent_timeout_s=env_float("ECHO_AGENT_TIMEOUT_S", 120.0),
            inbound_token=env_str("ECHO_INBOUND_TOKEN", ""),
            tick_hz=env_float("ECHO_TICK_HZ", 8.0),
            ui_port=env_int("ECHO_UI_PORT", 7863),
        )

    # -- derived -----------------------------------------------------------

    @property
    def tick_interval_s(self) -> float:
        return 1.0 / self.tick_hz if self.tick_hz > 0 else 0.125

    @property
    def inbound_enabled(self) -> bool:
        return bool(self.inbound_token.strip())

    @property
    def history_path(self) -> Path:
        return app_data_dir(self.app_name) / "history.jsonl"

    def brain_spec(self) -> dict[str, Any]:
        """The spec consumed by `shared.brain.build_brain`."""
        return {
            "kind": self.brain_kind,
            "litellm": {
                "base_url": self.llm_base_url,
                "api_key": self.llm_api_key,
                "model": self.llm_model,
                "system_prompt": self.persona,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "timeout": self.request_timeout_s,
                "max_history": self.max_history,
                "reasoning_enabled": self.reasoning_enabled,
            },
            "command": {
                "command": self.agent_cmd,
                "timeout": self.agent_timeout_s,
            },
        }

    # -- voice specs (consumed by shared.voice.build_*) --------------------

    @property
    def _tts_base(self) -> str:
        return self.tts_base_url or self.llm_base_url

    @property
    def _stt_base(self) -> str:
        return self.stt_base_url or self.llm_base_url

    def tts_spec(self) -> dict[str, Any]:
        return {
            "kind": "gateway",
            "gateway": {
                "base_url": self._tts_base,
                "api_key": self.tts_api_key or self.llm_api_key,
                "model": self.tts_model,
                "voice": self.tts_voice,
                "speed": self.tts_speed,
            },
        }

    def stt_spec(self) -> dict[str, Any]:
        return {
            "kind": "gateway",
            "gateway": {
                "base_url": self._stt_base,
                "api_key": self.stt_api_key or self.llm_api_key,
                "model": self.stt_model,
                "language": self.stt_language,
            },
        }

    def wake_spec(self) -> dict[str, Any]:
        # Auto-upgrade to Porcupine when an AccessKey is provided (so dropping the
        # key into .env is all it takes — no need to also flip ECHO_WAKE).
        kind = self.wake_kind
        if self.porcupine_access_key and kind == "always":
            kind = "porcupine"
        return {
            "kind": kind,
            "porcupine": {
                "access_key": self.porcupine_access_key,
                "keyword_path": self.porcupine_keyword_path,
                "builtin_keyword": self.porcupine_builtin,
            },
            "openwakeword": {"model": self.openww_model, "threshold": self.wake_threshold},
        }

    def vad_spec(self) -> dict[str, Any]:
        return {
            "vad": {
                "silence_ms": self.vad_silence_ms,
                "min_speech_ms": self.vad_min_speech_ms,
            }
        }

    def public_dict(self) -> dict[str, Any]:
        """UI-safe view — NO secrets (api key, inbound token, picovoice key excluded)."""
        return {
            "brain_kind": self.brain_kind,
            "llm_model": self.llm_model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "configured": bool(self.llm_base_url and self.llm_model),
            "voice_enabled": self.voice_enabled,
            "tts_model": self.tts_model,
            "tts_voice": self.tts_voice,
            "stt_model": self.stt_model,
            "wake_kind": self.wake_kind,
        }

    def apply_overrides(self, **kwargs: Any) -> None:
        """Apply UI-driven overrides (only known, safe, non-secret fields)."""
        allowed = {"temperature", "max_tokens", "llm_model", "persona"}
        for k, v in kwargs.items():
            if k in allowed and v is not None:
                setattr(self, k, v)
        self.temperature = max(0.0, min(2.0, float(self.temperature)))
        self.max_tokens = max(16, min(4096, int(self.max_tokens)))
