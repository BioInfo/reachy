"""
LiteLLM Provider

Connects to LiteLLM proxy server (OpenAI-compatible API).
Ideal for local models running on DGX or other GPU servers.
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import AsyncIterator, List, Optional

from openai import AsyncOpenAI

from .base import LLMProvider, ProviderCapability, ProviderCapabilities, Response

logger = logging.getLogger(__name__)

# Default endpoint (set LITELLM_URL env var for custom server)
DEFAULT_LITELLM_URL = "http://localhost:4000"


@dataclass
class LiteLLMConfig:
    """Configuration for LiteLLM provider."""

    base_url: str = field(default_factory=lambda: os.getenv("LITELLM_URL", DEFAULT_LITELLM_URL))
    api_key: str = field(default_factory=lambda: os.getenv("LITELLM_API_KEY", ""))
    model: str = field(default_factory=lambda: os.getenv("LITELLM_MODEL", "gpt-4o-mini"))
    temperature: float = 0.7
    max_tokens: int = 1024


class LiteLLMProvider(LLMProvider):
    """
    LiteLLM provider for local/remote models via OpenAI-compatible API.

    Uses LiteLLM proxy running on DGX Spark for GPU-accelerated inference.
    """

    def __init__(self, config: Optional[LiteLLMConfig] = None):
        self.config = config or LiteLLMConfig()
        self._client: Optional[AsyncOpenAI] = None
        self._conversation_history: List[dict] = []
        self._system_prompt: str = "You are Echo, a friendly robot companion."
        self._tools: List[dict] = []

    @property
    def name(self) -> str:
        return "litellm"

    async def connect(self) -> None:
        """Initialize OpenAI client pointing to LiteLLM."""
        logger.info(f"Connecting to LiteLLM at {self.config.base_url}")

        self._client = AsyncOpenAI(
            base_url=f"{self.config.base_url}/v1",
            api_key=self.config.api_key or "not-needed",  # Some LiteLLM setups don't need key
        )

        # Test connection by listing models
        try:
            models = await self._client.models.list()
            available = [m.id for m in models.data]
            logger.info(f"LiteLLM connected. Available models: {available[:5]}...")

            # Auto-select first available model if configured one isn't available
            if self.config.model not in available and available:
                logger.warning(
                    f"Model {self.config.model} not found, using {available[0]}"
                )
                self.config.model = available[0]

        except Exception as e:
            logger.error(f"Failed to connect to LiteLLM: {e}")
            raise

    async def disconnect(self) -> None:
        """Clean up client."""
        self._client = None
        self._conversation_history = []
        logger.info("LiteLLM disconnected")

    async def send_text(self, text: str) -> None:
        """Add user message to conversation history."""
        self._conversation_history.append({"role": "user", "content": text})

    async def send_audio(self, chunk: bytes) -> None:
        """LiteLLM doesn't support audio streaming directly."""
        raise NotImplementedError(
            "LiteLLM provider doesn't support audio streaming. "
            "Use separate STT/TTS or OpenAI Realtime provider."
        )

    async def receive_responses(self) -> AsyncIterator[Response]:
        """
        Get response from LiteLLM with streaming.

        Yields partial responses as they arrive.
        """
        if not self._client:
            raise RuntimeError("Provider not connected. Call connect() first.")

        # Build messages with system prompt
        messages = [{"role": "system", "content": self._system_prompt}]
        messages.extend(self._conversation_history)

        try:
            # Create streaming completion
            stream = await self._client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
                stream=True,
                tools=self._tools if self._tools else None,
            )

            full_response = ""
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield Response(text=content, is_final=False)

            # Add assistant response to history
            if full_response:
                self._conversation_history.append(
                    {"role": "assistant", "content": full_response}
                )

            # Final response
            yield Response(text="", is_final=True)

        except Exception as e:
            logger.error(f"LiteLLM request failed: {e}")
            yield Response(
                text=f"Error: {str(e)}",
                is_final=True,
                metadata={"error": True},
            )

    def get_capabilities(self) -> ProviderCapabilities:
        """Return LiteLLM capabilities."""
        return ProviderCapabilities(
            supported={
                ProviderCapability.MULTI_TURN,
                ProviderCapability.TOOL_CALLING,
                ProviderCapability.LOCAL_PROCESSING,  # Runs on DGX
            },
            max_context_tokens=8192,  # Depends on model
            supports_system_prompt=True,
            voice_options=[],  # No native voice
        )

    async def set_system_prompt(self, prompt: str) -> None:
        """Update system prompt."""
        self._system_prompt = prompt
        logger.debug(f"System prompt updated ({len(prompt)} chars)")

    async def register_tools(self, tools: List[dict]) -> None:
        """Register tools for function calling."""
        self._tools = tools
        logger.debug(f"Registered {len(tools)} tools")

    def clear_history(self) -> None:
        """Clear conversation history."""
        self._conversation_history = []
        logger.debug("Conversation history cleared")

    async def get_response(self, text: str) -> str:
        """
        Convenience method: send text and get full response.

        Args:
            text: User message

        Returns:
            Complete assistant response
        """
        await self.send_text(text)

        full_response = ""
        async for response in self.receive_responses():
            if response.text:
                full_response += response.text

        return full_response

    async def get_available_models(self) -> List[str]:
        """List available models from LiteLLM."""
        if not self._client:
            raise RuntimeError("Provider not connected")

        models = await self._client.models.list()
        return [m.id for m in models.data]
