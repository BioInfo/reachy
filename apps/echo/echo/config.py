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
    "at their desk. Be friendly and present, never robotic or listy."
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
            },
            "command": {
                "command": self.agent_cmd,
                "timeout": self.agent_timeout_s,
            },
        }

    def public_dict(self) -> dict[str, Any]:
        """UI-safe view — NO secrets (api key, inbound token excluded)."""
        return {
            "brain_kind": self.brain_kind,
            "llm_model": self.llm_model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "configured": bool(self.llm_base_url and self.llm_model),
        }

    def apply_overrides(self, **kwargs: Any) -> None:
        """Apply UI-driven overrides (only known, safe, non-secret fields)."""
        allowed = {"temperature", "max_tokens", "llm_model", "persona"}
        for k, v in kwargs.items():
            if k in allowed and v is not None:
                setattr(self, k, v)
        self.temperature = max(0.0, min(2.0, float(self.temperature)))
        self.max_tokens = max(16, min(4096, int(self.max_tokens)))
