"""
Base LLM Provider Interface

Abstract interface for swappable LLM backends (OpenAI, Ollama, Gemini, etc.)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import AsyncIterator, List, Optional


class ProviderCapability(Enum):
    """Capabilities that providers may or may not support."""

    STREAMING_AUDIO = auto()  # Real-time audio streaming
    VISION = auto()  # Image understanding
    TOOL_CALLING = auto()  # Function/tool calling
    MULTI_TURN = auto()  # Conversation context
    LOCAL_PROCESSING = auto()  # Runs locally (privacy)


@dataclass
class ProviderCapabilities:
    """Describes what a provider can do."""

    supported: set[ProviderCapability] = field(default_factory=set)
    max_context_tokens: int = 4096
    supports_system_prompt: bool = True
    voice_options: List[str] = field(default_factory=list)


@dataclass
class Response:
    """Response from an LLM provider."""

    text: Optional[str] = None
    audio: Optional[bytes] = None
    tool_calls: Optional[List[dict]] = None
    is_final: bool = False
    metadata: dict = field(default_factory=dict)


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.

    Implement this interface to add new backends (OpenAI, Ollama, etc.)
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for logging and UI."""
        ...

    @abstractmethod
    async def connect(self) -> None:
        """
        Establish connection to the provider.

        May involve API authentication, model loading, etc.
        """
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """Clean up connection and resources."""
        ...

    @abstractmethod
    async def send_text(self, text: str) -> None:
        """
        Send a text message to the provider.

        Args:
            text: User message to send
        """
        ...

    @abstractmethod
    async def send_audio(self, chunk: bytes) -> None:
        """
        Stream audio input to the provider.

        Args:
            chunk: Audio data chunk (format depends on provider)

        Note: Not all providers support this. Check capabilities first.
        """
        ...

    @abstractmethod
    async def receive_responses(self) -> AsyncIterator[Response]:
        """
        Yield responses from the provider.

        Responses may be partial (streaming) or complete.
        Check `is_final` to know when response is complete.
        """
        ...

    @abstractmethod
    def get_capabilities(self) -> ProviderCapabilities:
        """
        Return provider capabilities for feature detection.

        Used to adapt UI and features based on what provider supports.
        """
        ...

    @abstractmethod
    async def set_system_prompt(self, prompt: str) -> None:
        """
        Update the system prompt / persona.

        Args:
            prompt: New system prompt to use
        """
        ...

    @abstractmethod
    async def register_tools(self, tools: List[dict]) -> None:
        """
        Register available tools with the provider.

        Args:
            tools: List of tool definitions in OpenAI-compatible format

        Note: Not all providers support tools. Check capabilities first.
        """
        ...

    def supports(self, capability: ProviderCapability) -> bool:
        """Check if provider supports a specific capability."""
        return capability in self.get_capabilities().supported
