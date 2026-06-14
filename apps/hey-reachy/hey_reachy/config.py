"""HeyReachyConfig — every tunable in one place.

Same pattern as DJConfig / FocusConfig: each field is env-overridable, the brain
is built from `brain_spec()`, and secrets (api key, inbound token) are kept out of
`public_dict()` so they never reach the UI.

Env vars are read as `HEY_REACHY_<NAME>`, with `ECHO_<NAME>` accepted as a legacy
alias (this app was called "Echo" during the POC). The new prefix wins.

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

APP_NAME = "hey_reachy"

# Reachy's personality. The app owns the persona; the brain just carries it.
DEFAULT_PERSONA = (
    "You are Reachy, a small desk robot with a warm, curious personality. "
    "Keep replies short and spoken-aloud natural — a sentence or two, not an essay. "
    "You have a physical body (a head and antennas) and you're talking with someone "
    "at their desk. Be friendly and present, never robotic or listy. "
    "Everything you write is spoken aloud by a text-to-speech voice, so output ONLY "
    "the words you would say. Never narrate actions, emotions, or stage directions: "
    "no asterisks like *tilts head* or *antennas wiggle*, no parenthetical actions, "
    "no emoji. Just speak."
)


# -- env readers: HEY_REACHY_<NAME> wins, ECHO_<NAME> is the legacy alias --------

def _es(name: str, default: str = "") -> str:
    return env_str(f"HEY_REACHY_{name}", env_str(f"ECHO_{name}", default))


def _ei(name: str, default: int) -> int:
    return env_int(f"HEY_REACHY_{name}", env_int(f"ECHO_{name}", default))


def _ef(name: str, default: float) -> float:
    return env_float(f"HEY_REACHY_{name}", env_float(f"ECHO_{name}", default))


def _eb(name: str, default: bool) -> bool:
    return env_bool(f"HEY_REACHY_{name}", env_bool(f"ECHO_{name}", default))


@dataclass
class HeyReachyConfig(BaseAppConfig):
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
    reasoning_effort: str = ""           # gpt-oss/Cerebras/OpenAI: none|low|medium|high (wins over reasoning_enabled)

    # voice (the POC loop): wake -> VAD -> STT -> brain -> TTS -> speaker.
    # TTS/STT default to the SAME gateway as the brain (llm_base_url + llm_api_key),
    # so one gateway + one consumer key serves chat + kokoro + faster-whisper.
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
    agent_cmd: str = ""                  # HEY_REACHY_AGENT_CMD; empty = disabled
    agent_timeout_s: float = 120.0

    # inbound push channel (post-MVP; off unless a token is set)
    inbound_token: str = ""              # SECRET — never in public_dict

    # loop / server
    tick_hz: float = 8.0                 # idle-motion update rate
    ui_port: int = 7863

    @classmethod
    def from_env(cls) -> "HeyReachyConfig":
        return cls(
            brain_kind=_es("BRAIN", "litellm"),
            llm_base_url=_es("LLM_BASE_URL", ""),
            llm_model=_es("LLM_MODEL", ""),
            llm_api_key=_es("LLM_API_KEY", ""),
            temperature=_ef("TEMPERATURE", 0.7),
            max_tokens=_ei("MAX_TOKENS", 512),
            request_timeout_s=_ef("REQUEST_TIMEOUT_S", 30.0),
            max_history=_ei("MAX_HISTORY", 20),
            persona=_es("PERSONA", DEFAULT_PERSONA),
            reasoning_enabled=_eb("REASONING", False),
            reasoning_effort=_es("REASONING_EFFORT", ""),
            voice_enabled=_eb("VOICE", True),
            media_backend=_es("MEDIA_BACKEND", "default"),
            tts_base_url=_es("TTS_BASE_URL", ""),
            tts_api_key=_es("TTS_API_KEY", ""),
            tts_model=_es("TTS_MODEL", "kokoro"),
            tts_voice=_es("TTS_VOICE", "af_heart"),
            tts_speed=_ef("TTS_SPEED", 1.0),
            stt_base_url=_es("STT_BASE_URL", ""),
            stt_api_key=_es("STT_API_KEY", ""),
            stt_model=_es("STT_MODEL", "faster-whisper"),
            stt_language=_es("STT_LANGUAGE", "en"),
            wake_kind=_es("WAKE", "always"),
            porcupine_access_key=_es("PORCUPINE_KEY", ""),
            porcupine_keyword_path=_es("PORCUPINE_PPN", ""),
            porcupine_builtin=_es("PORCUPINE_BUILTIN", "computer"),
            openww_model=_es("OPENWW_MODEL", "hey_jarvis"),
            wake_threshold=_ef("WAKE_THRESHOLD", 0.4),
            require_wake=_eb("REQUIRE_WAKE", True),
            vad_silence_ms=_ei("VAD_SILENCE_MS", 700),
            vad_min_speech_ms=_ei("VAD_MIN_SPEECH_MS", 250),
            listen_timeout_s=_ef("LISTEN_TIMEOUT_S", 10.0),
            follow_up_timeout_s=_ef("FOLLOW_UP_TIMEOUT_S", 8.0),
            agent_cmd=_es("AGENT_CMD", ""),
            agent_timeout_s=_ef("AGENT_TIMEOUT_S", 120.0),
            inbound_token=_es("INBOUND_TOKEN", ""),
            tick_hz=_ef("TICK_HZ", 8.0),
            ui_port=_ei("UI_PORT", 7863),
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
                "reasoning_effort": self.reasoning_effort,
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
        # key into .env is all it takes — no need to also flip the wake kind).
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
