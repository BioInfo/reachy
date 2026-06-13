"""LiteLLMBrain — conversation through an OpenAI-compatible endpoint.

The POC brain. Points at any OpenAI-compatible chat endpoint (a LiteLLM gateway,
OpenAI, a local server) by base URL + model + key, all supplied via config. The
backend is just `chat.completions.create`; the model is whatever the operator
configures.

Synchronous on purpose — it's network I/O the app calls from a worker thread, and
sync keeps it unit-testable without an event loop. Non-streaming for the text POC;
streaming arrives with the voice phase.
"""

from __future__ import annotations

import logging
from typing import Any

from .base import Brain, Message, Reply

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = (
    "You are Echo, a small desk robot with a warm, curious personality. "
    "Keep replies short and spoken-aloud natural — a sentence or two, not an essay. "
    "You have a physical body (a head and antennas) and you're talking with someone "
    "at their desk. Be friendly and present, never robotic or listy."
)


class LiteLLMBrain:
    """OpenAI-compatible chat brain. Configured entirely from a spec."""

    name = "litellm"

    def __init__(
        self,
        base_url: str = "",
        api_key: str = "",
        model: str = "",
        *,
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        temperature: float = 0.7,
        max_tokens: int = 512,
        timeout: float = 30.0,
        max_history: int = 20,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._api_key = api_key
        self.model = model
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.max_history = max_history
        self._client: Any = None  # lazily built openai.OpenAI

    @property
    def available(self) -> bool:
        """Configured enough to try: we have an endpoint and a model."""
        return bool(self.base_url and self.model)

    def _ensure_client(self) -> Any:
        if self._client is None:
            from openai import OpenAI  # lazy — keeps `import shared.brain` light

            self._client = OpenAI(
                base_url=self.base_url,
                api_key=self._api_key or "not-needed",
                timeout=self.timeout,
            )
        return self._client

    def _messages(self, text: str, history: list[Message]) -> list[Message]:
        msgs: list[Message] = [{"role": "system", "content": self.system_prompt}]
        if history:
            msgs.extend(history[-self.max_history :])
        msgs.append({"role": "user", "content": text})
        return msgs

    def respond(self, text: str, history: list[Message]) -> Reply:
        if not self.available:
            return Reply.failed(
                "No conversation endpoint is configured yet. "
                "Set the model endpoint to start talking.",
                model=self.model,
            )
        try:
            client = self._ensure_client()
            resp = client.chat.completions.create(
                model=self.model,
                messages=self._messages(text, history),
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
            content = (resp.choices[0].message.content or "").strip()
            if not content:
                return Reply.failed("The model returned an empty reply.", model=self.model)
            return Reply(text=content, model=self.model)
        except Exception as exc:  # noqa: BLE001 — any backend failure stays graceful
            logger.warning("LiteLLMBrain request failed: %s", exc)
            return Reply.failed(f"Could not reach the model ({exc.__class__.__name__}).", model=self.model)
