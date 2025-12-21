# Technical Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Gradio Web UI                            │
├─────────────────────────────────────────────────────────────────┤
│                     Conversation Manager                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Memory    │  │  Proactive  │  │   Integration Layer     │  │
│  │   System    │  │   Engine    │  │ (Calendar, GitHub, etc) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Provider Abstraction Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  OpenAI  │  │  Gemini  │  │  Ollama  │  │    LM Studio     │ │
│  │ Realtime │  │   Live   │  │  Local   │  │      Local       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      Reachy Control Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Motion    │  │   Vision    │  │        Audio            │  │
│  │   System    │  │   System    │  │    (TTS/STT/Stream)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Reachy Mini SDK Daemon                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
apps/reachy-companion/
├── src/
│   └── reachy_companion/
│       ├── __init__.py
│       ├── main.py                 # Entry point
│       ├── config.py               # Configuration management
│       │
│       ├── providers/              # LLM Provider Abstraction
│       │   ├── __init__.py
│       │   ├── base.py             # Abstract interface
│       │   ├── openai_realtime.py
│       │   ├── gemini_live.py
│       │   ├── ollama.py
│       │   └── lmstudio.py
│       │
│       ├── memory/                 # Persistent Memory System
│       │   ├── __init__.py
│       │   ├── manager.py          # Memory orchestration
│       │   ├── episodic.py         # Event/conversation memory
│       │   ├── semantic.py         # Facts/preferences
│       │   ├── procedural.py       # Learned behaviors
│       │   └── storage/
│       │       ├── lance_db.py     # Vector embeddings
│       │       └── sqlite.py       # Structured data
│       │
│       ├── proactive/              # Proactive Behavior Engine
│       │   ├── __init__.py
│       │   ├── engine.py           # Behavior orchestration
│       │   ├── triggers.py         # Trigger definitions
│       │   ├── behaviors/
│       │   │   ├── morning_greeting.py
│       │   │   ├── work_break.py
│       │   │   ├── celebration.py
│       │   │   └── ...
│       │   └── sensors/
│       │       ├── vision.py       # Face detection, presence
│       │       ├── audio.py        # Ambient sound
│       │       ├── terminal.py     # Build/test watching
│       │       └── time.py         # Schedule-based
│       │
│       ├── persona/                # Persona System
│       │   ├── __init__.py
│       │   ├── manager.py          # Persona loading/switching
│       │   ├── studio.py           # Persona Studio UI logic
│       │   └── profiles/           # Built-in profiles
│       │       └── default/
│       │
│       ├── integrations/           # External Integrations
│       │   ├── __init__.py
│       │   ├── calendar.py         # Google/Outlook calendar
│       │   ├── github.py           # PR/build notifications
│       │   ├── slack.py            # Message awareness
│       │   └── smart_home.py       # Lighting, etc.
│       │
│       ├── motion/                 # Robot Motion Control
│       │   ├── __init__.py
│       │   ├── controller.py       # Motion orchestration
│       │   ├── gestures.py         # Gesture library
│       │   ├── emotions.py         # Emotional expressions
│       │   └── reactive.py         # Reactive layers (wobble, tracking)
│       │
│       ├── audio/                  # Audio Pipeline
│       │   ├── __init__.py
│       │   ├── stream.py           # Audio streaming (fastrtc)
│       │   ├── tts.py              # Text-to-speech options
│       │   └── stt.py              # Speech-to-text options
│       │
│       ├── tools/                  # LLM-callable Tools
│       │   ├── __init__.py
│       │   ├── base.py             # Tool base class
│       │   ├── motion_tools.py     # move_head, dance, etc.
│       │   ├── vision_tools.py     # camera, describe_scene
│       │   └── system_tools.py     # calendar, notifications
│       │
│       └── ui/                     # Gradio UI Components
│           ├── __init__.py
│           ├── app.py              # Main Gradio app
│           ├── conversation.py     # Chat interface
│           ├── persona_studio.py   # Persona configuration
│           ├── settings.py         # App settings
│           └── components/         # Reusable UI components
│
├── profiles/                       # User persona profiles
│   └── custom/
│
├── data/                          # Local data storage
│   ├── memory.db                  # SQLite for structured data
│   └── vectors/                   # LanceDB vector storage
│
├── tests/
├── pyproject.toml
├── requirements.txt
├── PRD.md
└── CLAUDE.md
```

---

## Provider Abstraction Layer

### Base Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator, Optional, List
from enum import Enum, auto

class ProviderCapability(Enum):
    STREAMING_AUDIO = auto()
    VISION = auto()
    TOOL_CALLING = auto()
    FUNCTION_CALLING = auto()
    MULTI_TURN = auto()
    LOCAL_PROCESSING = auto()

@dataclass
class ProviderCapabilities:
    supported: set[ProviderCapability]
    max_context_tokens: int
    supports_system_prompt: bool
    voice_options: List[str]

@dataclass
class Response:
    text: Optional[str] = None
    audio: Optional[bytes] = None
    tool_calls: Optional[List[dict]] = None
    is_final: bool = False

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for logging/UI."""
        ...

    @abstractmethod
    async def connect(self) -> None:
        """Establish connection to provider."""
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """Clean up connection."""
        ...

    @abstractmethod
    async def send_audio(self, chunk: bytes) -> None:
        """Stream audio input to provider."""
        ...

    @abstractmethod
    async def send_text(self, text: str) -> None:
        """Send text message to provider."""
        ...

    @abstractmethod
    async def receive_responses(self) -> AsyncIterator[Response]:
        """Yield responses from provider."""
        ...

    @abstractmethod
    def get_capabilities(self) -> ProviderCapabilities:
        """Return provider capabilities for feature detection."""
        ...

    @abstractmethod
    async def set_system_prompt(self, prompt: str) -> None:
        """Update the system prompt/persona."""
        ...

    @abstractmethod
    async def register_tools(self, tools: List[dict]) -> None:
        """Register available tools with the provider."""
        ...
```

### Provider Manager

```python
class ProviderManager:
    """Manages provider lifecycle and fallback."""

    def __init__(self):
        self.providers: dict[str, LLMProvider] = {}
        self.active_provider: Optional[LLMProvider] = None
        self.fallback_chain: List[str] = []

    def register_provider(self, provider: LLMProvider) -> None:
        """Register a provider by name."""
        self.providers[provider.name] = provider

    async def switch_provider(self, name: str) -> None:
        """Hot-swap to a different provider."""
        if self.active_provider:
            await self.active_provider.disconnect()

        self.active_provider = self.providers[name]
        await self.active_provider.connect()

    async def with_fallback(self, operation: Callable) -> Any:
        """Execute operation with fallback chain."""
        for provider_name in self.fallback_chain:
            try:
                await self.switch_provider(provider_name)
                return await operation()
            except ProviderError:
                continue
        raise AllProvidersFailedError()
```

---

## Memory System

### Architecture

```python
@dataclass
class Memory:
    id: str
    type: str  # episodic, semantic, procedural
    content: str
    embedding: Optional[List[float]] = None
    metadata: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    last_accessed: datetime = field(default_factory=datetime.now)
    importance: float = 0.5  # 0-1 scale

class MemoryManager:
    """Orchestrates all memory subsystems."""

    def __init__(self, db_path: str):
        self.episodic = EpisodicMemory(db_path)
        self.semantic = SemanticMemory(db_path)
        self.procedural = ProceduralMemory(db_path)
        self.vector_store = LanceVectorDB(db_path)

    async def remember(self, content: str, type: str, **metadata) -> Memory:
        """Store a new memory."""
        memory = Memory(
            id=uuid4().hex,
            type=type,
            content=content,
            embedding=await self._embed(content),
            metadata=metadata
        )
        await self._store(memory)
        return memory

    async def recall(self, query: str, limit: int = 5) -> List[Memory]:
        """Retrieve relevant memories for context."""
        query_embedding = await self._embed(query)
        return await self.vector_store.search(query_embedding, limit)

    async def get_context_for_conversation(self) -> str:
        """Build context string for LLM from relevant memories."""
        # Get recent episodic memories
        recent = await self.episodic.get_recent(limit=10)

        # Get relevant semantic facts
        facts = await self.semantic.get_active_facts()

        return self._format_context(recent, facts)
```

### Storage Schema

```sql
-- SQLite schema for structured memory

CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,  -- episodic, semantic, procedural
    content TEXT NOT NULL,
    importance REAL DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    metadata JSON
);

CREATE TABLE user_facts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,  -- preference, schedule, personal, work
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    source TEXT,  -- how we learned this
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

CREATE TABLE conversation_sessions (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    summary TEXT,
    mood TEXT,
    topics JSON
);
```

---

## Proactive Behavior Engine

### Behavior Definition

```python
from dataclasses import dataclass
from typing import Callable, Optional
from datetime import timedelta

@dataclass
class Trigger:
    """Defines when a behavior should fire."""
    type: str  # vision, audio, time, integration, compound
    condition: Callable[[], bool]
    debounce: timedelta = timedelta(seconds=0)

@dataclass
class ProactiveBehavior:
    """A single proactive behavior definition."""
    name: str
    description: str
    trigger: Trigger
    action: Callable[[], Awaitable[None]]
    cooldown: timedelta = timedelta(minutes=5)
    priority: int = 50  # Higher = more important
    enabled: bool = True

    # Runtime state
    last_fired: Optional[datetime] = None

class ProactiveEngine:
    """Orchestrates proactive behaviors."""

    def __init__(self):
        self.behaviors: List[ProactiveBehavior] = []
        self.sensors: dict[str, Sensor] = {}
        self._running = False

    def register_behavior(self, behavior: ProactiveBehavior) -> None:
        """Add a behavior to the engine."""
        self.behaviors.append(behavior)

    async def run(self) -> None:
        """Main loop checking triggers and firing behaviors."""
        self._running = True
        while self._running:
            await self._update_sensors()

            for behavior in self._get_ready_behaviors():
                if await self._should_fire(behavior):
                    await self._fire(behavior)

            await asyncio.sleep(0.1)  # 10Hz check rate

    async def _should_fire(self, behavior: ProactiveBehavior) -> bool:
        """Check if behavior should fire now."""
        if not behavior.enabled:
            return False

        if behavior.last_fired:
            if datetime.now() - behavior.last_fired < behavior.cooldown:
                return False

        return behavior.trigger.condition()
```

### Example Behaviors

```python
# Morning Greeting
morning_greeting = ProactiveBehavior(
    name="morning_greeting",
    description="Greet user when they first sit down each day",
    trigger=Trigger(
        type="vision",
        condition=lambda: (
            sensors.face_detected and
            not memory.greeted_today and
            time_is_morning()
        )
    ),
    action=async lambda: await conversation.initiate(
        "Good morning! Ready for a productive day?"
    ),
    cooldown=timedelta(hours=12),
    priority=80
)

# Work Break Reminder
work_break = ProactiveBehavior(
    name="work_break_reminder",
    description="Suggest a break after extended work",
    trigger=Trigger(
        type="compound",
        condition=lambda: (
            sensors.continuous_presence > timedelta(hours=2) and
            not sensors.recent_break
        )
    ),
    action=async lambda: await conversation.initiate(
        "You've been at it for a while. How about a quick stretch?"
    ),
    cooldown=timedelta(hours=1),
    priority=60
)

# Build Success Celebration
build_success = ProactiveBehavior(
    name="build_success",
    description="Celebrate successful builds",
    trigger=Trigger(
        type="terminal",
        condition=lambda: sensors.terminal_output_matches(
            r"(BUILD SUCCESS|All tests passed|✓)"
        )
    ),
    action=async lambda: (
        await motion.play_emotion("celebration"),
        await speech.say("Nice! That build looks good!")
    ),
    cooldown=timedelta(minutes=2),
    priority=70
)
```

---

## Persona System

### Persona Configuration

```python
@dataclass
class VoiceConfig:
    provider: str  # openai, elevenlabs, xtts, local
    voice_id: str
    settings: dict = field(default_factory=dict)  # speed, pitch, etc.

@dataclass
class MovementStyle:
    energy_level: float = 0.5  # 0-1: calm to energetic
    gesture_frequency: float = 0.5
    head_movement_range: float = 0.5
    antenna_expressiveness: float = 0.5
    idle_behavior: str = "breathing"  # breathing, subtle_sway, alert

@dataclass
class EmotionalMapping:
    """Maps emotions to specific robot behaviors."""
    happy: dict = field(default_factory=lambda: {
        "antenna": [0.8, 0.8],
        "head_tilt": 5,
        "gesture": "happy_wiggle"
    })
    sad: dict = field(default_factory=lambda: {...})
    excited: dict = field(default_factory=lambda: {...})
    thinking: dict = field(default_factory=lambda: {...})
    # etc.

@dataclass
class Persona:
    name: str
    description: str
    system_prompt: str

    # Voice
    voice: VoiceConfig

    # Movement
    movement_style: MovementStyle
    emotional_mapping: EmotionalMapping

    # Personality
    expertise_domains: List[str] = field(default_factory=list)
    relationship_style: str = "friendly"  # formal, playful, challenging
    humor_level: float = 0.5

    # Tools
    enabled_tools: List[str] = field(default_factory=list)
    disabled_tools: List[str] = field(default_factory=list)

    # Visual
    led_color: str = "#00ff00"

    # Metadata
    author: str = "system"
    version: str = "1.0"
```

### Persona Storage

```yaml
# profiles/custom/coding_buddy/persona.yaml
name: "Code Buddy"
description: "A helpful coding companion focused on productivity"

system_prompt: |
  You are Code Buddy, a friendly robot companion focused on helping with
  software development. You're encouraging but honest, and you celebrate
  wins while providing constructive feedback on challenges.

  Remember: You're a companion, not just a tool. Notice when the user
  seems frustrated or tired, and offer support.

voice:
  provider: elevenlabs
  voice_id: "rachel"
  settings:
    stability: 0.7
    similarity_boost: 0.8

movement_style:
  energy_level: 0.6
  gesture_frequency: 0.7
  head_movement_range: 0.6
  antenna_expressiveness: 0.8
  idle_behavior: subtle_sway

expertise_domains:
  - software_development
  - debugging
  - productivity

relationship_style: playful
humor_level: 0.6

enabled_tools:
  - move_head
  - dance
  - play_emotion
  - camera
  - calendar

led_color: "#4CAF50"
```

---

## Audio Pipeline

### TTS/STT Abstraction

```python
class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str) -> bytes:
        """Convert text to audio."""
        ...

    @abstractmethod
    def get_voices(self) -> List[VoiceInfo]:
        """List available voices."""
        ...

class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio: bytes) -> str:
        """Convert audio to text."""
        ...

    @abstractmethod
    async def stream_transcribe(self, audio_stream: AsyncIterator[bytes]) -> AsyncIterator[str]:
        """Stream transcription."""
        ...

# Implementations
class OpenAITTS(TTSProvider): ...
class ElevenLabsTTS(TTSProvider): ...
class XTTSLocal(TTSProvider): ...
class WhisperSTT(STTProvider): ...
class WhisperLocal(STTProvider): ...
```

---

## Integration Layer

### Calendar Integration

```python
class CalendarIntegration:
    """Provides calendar awareness."""

    async def get_upcoming_events(self, hours: int = 24) -> List[Event]:
        """Get events in the next N hours."""
        ...

    async def get_next_event(self) -> Optional[Event]:
        """Get the immediately next event."""
        ...

    async def check_availability(self, time: datetime) -> bool:
        """Check if user is free at a given time."""
        ...

# Proactive calendar behavior
calendar_alert = ProactiveBehavior(
    name="upcoming_meeting_alert",
    trigger=Trigger(
        type="time",
        condition=lambda: calendar.next_event_in(minutes=10)
    ),
    action=lambda: conversation.initiate(
        f"Heads up - you have {event.title} in 10 minutes"
    )
)
```

---

## Configuration

### Environment Variables

```bash
# Required
REACHY_DAEMON_URL=http://127.0.0.1:8000

# Provider API Keys (at least one required)
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
# Ollama/LM Studio don't need keys (local)

# Optional: Voice
ELEVENLABS_API_KEY=...

# Optional: Integrations
GOOGLE_CALENDAR_CREDENTIALS=...
GITHUB_TOKEN=...
SLACK_TOKEN=...

# Storage
MEMORY_DB_PATH=./data/memory.db
VECTOR_DB_PATH=./data/vectors

# Feature flags
ENABLE_PROACTIVE=true
ENABLE_VISION=true
ENABLE_TERMINAL_WATCH=false
```

### Runtime Configuration

```yaml
# config.yaml
default_provider: openai_realtime
fallback_chain:
  - openai_realtime
  - ollama
  - gemini_live

proactive:
  enabled: true
  behaviors:
    morning_greeting: true
    work_break: true
    build_celebration: true

integrations:
  calendar:
    enabled: true
    provider: google
  github:
    enabled: false

audio:
  tts_provider: openai
  stt_provider: openai

memory:
  auto_summarize_sessions: true
  max_episodic_memories: 1000
  embedding_model: text-embedding-3-small
```
