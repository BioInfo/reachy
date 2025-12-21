# Phased Roadmap

## Phase Overview

| Phase | Name | Focus | Timeline Target |
|-------|------|-------|-----------------|
| 0 | Foundation | Project setup, SDK integration | - |
| 1 | MVP | Multi-backend + memory + 3 proactive behaviors | - |
| 2 | Relationship | Full memory + Persona Studio + integrations | - |
| 3 | Ecosystem | Plugin system + marketplace + advanced features | - |

---

## Phase 0: Foundation

### Goals
- Project structure established
- Development environment working
- Basic Reachy connectivity verified

### Deliverables

- [ ] Create `apps/reachy-companion/` directory structure
- [ ] Set up Python project with pyproject.toml
- [ ] Create virtual environment with dependencies
- [ ] Verify Reachy daemon connectivity
- [ ] Port basic motion controls from SDK
- [ ] Create minimal Gradio UI shell
- [ ] Write initial tests

### Success Criteria
- Can connect to Reachy daemon
- Can move head/antennas programmatically
- Gradio UI launches and shows status

---

## Phase 1: MVP

**Theme:** Core differentiators working end-to-end

### 1.1 Multi-Backend Support

#### OpenAI Realtime Provider
- [ ] Implement provider interface for OpenAI Realtime API
- [ ] Audio streaming via fastrtc
- [ ] Tool calling support
- [ ] Voice selection (OpenAI voices)

#### Ollama Provider
- [ ] Implement provider interface for Ollama
- [ ] Text-based conversation (audio via separate TTS/STT)
- [ ] Model selection (Llama, Mistral, etc.)
- [ ] Local embedding generation

#### Provider Manager
- [ ] Hot-swap between providers
- [ ] Capability detection
- [ ] Basic fallback handling

### 1.2 Simple Persistent Memory

- [ ] SQLite database for structured data
- [ ] LanceDB for vector embeddings
- [ ] User facts storage (preferences, name, etc.)
- [ ] Conversation session tracking
- [ ] Recent conversation recall
- [ ] Context building for LLM

### 1.3 Three Proactive Behaviors

#### Morning Greeting
- [ ] Face detection sensor
- [ ] "First today" tracking
- [ ] Personalized greeting with memory context
- [ ] Configurable time window

#### Work Break Reminder
- [ ] Presence duration tracking
- [ ] Gentle interruption design
- [ ] Cooldown management
- [ ] User preference for frequency

#### Build Success Celebration
- [ ] Terminal output monitoring (optional)
- [ ] Pattern matching for success indicators
- [ ] Celebration emotion/gesture
- [ ] Brief verbal acknowledgment

### 1.4 Enhanced Persona (Basic)

- [ ] System prompt configuration
- [ ] Voice selection (from provider options)
- [ ] Movement style presets (calm, energetic, quirky)
- [ ] Persona switching in UI

### 1.5 MVP UI

- [ ] Conversation interface
- [ ] Provider selection dropdown
- [ ] Persona selection
- [ ] Basic settings panel
- [ ] Connection status indicator

### MVP Success Criteria

1. Can have voice conversation using OpenAI Realtime
2. Can switch to Ollama and continue conversation (text-based)
3. Robot remembers user's name and preferences across sessions
4. Robot greets user when they sit down (proactive)
5. Robot suggests breaks after extended work (proactive)
6. Robot celebrates build success (proactive)
7. Can switch between 2+ personas with different voices/styles

---

## Phase 2: Relationship

**Theme:** Depth of memory, personalization, and integration

### 2.1 Gemini Live Provider

- [ ] Implement provider interface for Gemini Live API
- [ ] Audio streaming support
- [ ] Multimodal capabilities
- [ ] Tool/function calling

### 2.2 Full Memory System

#### Episodic Memory
- [ ] Conversation summarization
- [ ] Event extraction (what happened)
- [ ] Temporal indexing
- [ ] Importance scoring

#### Semantic Memory
- [ ] Fact extraction from conversations
- [ ] Preference learning
- [ ] Relationship modeling
- [ ] Confidence tracking

#### Memory Retrieval
- [ ] Semantic search for relevant memories
- [ ] Temporal recency weighting
- [ ] Natural reference in conversation
- [ ] "What do you remember?" introspection

### 2.3 Persona Studio

- [ ] Visual persona editor
- [ ] Voice selection with preview
- [ ] Movement style customization
- [ ] Emotional mapping editor
- [ ] Expertise domain selection
- [ ] Export/import personas
- [ ] Profile picture/avatar

### 2.4 Additional Proactive Behaviors

- [ ] Return greeting (after absence)
- [ ] End of call check-in
- [ ] Calendar event alerts
- [ ] Frustration detection (stretch goal)

### 2.5 Integrations

#### Calendar
- [ ] Google Calendar connection
- [ ] Upcoming event awareness
- [ ] Meeting prep context
- [ ] Proactive alerts

#### Basic Notifications
- [ ] GitHub PR/build status (optional)
- [ ] Custom webhook receiver

### 2.6 Enhanced Audio

- [ ] ElevenLabs TTS option
- [ ] Voice cloning setup
- [ ] Local Whisper STT option
- [ ] XTTS for local TTS

### Phase 2 Success Criteria

1. Gemini Live works as third provider option
2. Robot references specific past conversations naturally
3. Learns and uses preferences without being told
4. Persona Studio allows full customization
5. Calendar alerts work proactively
6. Multiple voice options (cloud and local)

---

## Phase 3: Ecosystem

**Theme:** Extensibility, community, and advanced features

### 3.1 Plugin System

- [ ] Plugin API specification
- [ ] Integration plugin template
- [ ] Proactive behavior plugin template
- [ ] Tool plugin template
- [ ] Plugin discovery and loading
- [ ] Plugin settings UI

### 3.2 Skill/Achievement System

- [ ] Achievement definitions
- [ ] Progress tracking
- [ ] Unlock notifications
- [ ] Statistics dashboard
- [ ] Streak tracking

### 3.3 Persona Marketplace

- [ ] Persona packaging format
- [ ] Local persona library
- [ ] Community sharing mechanism
- [ ] Import from URL/file

### 3.4 Advanced Proactive Behaviors

- [ ] Screen reading (OCR)
- [ ] IDE error detection
- [ ] Ambient audio classification
- [ ] Object awareness (desk changes)

### 3.5 Additional Integrations

- [ ] Slack/Teams awareness
- [ ] Todoist/Things integration
- [ ] Smart home (basic)
- [ ] Music control

### 3.6 Accessibility

- [ ] High contrast mode
- [ ] Screen reader support
- [ ] Simplified mode
- [ ] Adjustable interaction speed

### Phase 3 Success Criteria

1. Third-party plugins can add new behaviors
2. Achievement system creates engagement loop
3. Can share personas with others
4. Screen reading provides coding assistance
5. Works with major productivity tools

---

## Development Principles

### Throughout All Phases

1. **Test as you go** - Unit tests for core logic, integration tests for providers
2. **Document the API** - Other developers should be able to extend
3. **Privacy by default** - Local storage, explicit opt-in for cloud features
4. **Graceful degradation** - Features fail safely without breaking core experience
5. **User feedback loops** - Make it easy to report issues and request features

### Architecture Decisions

- Use dependency injection for swappable components
- Async-first design for all I/O operations
- Configuration over code for behavior tuning
- Structured logging for debugging
- Feature flags for experimental features

---

## Key Milestones

| Milestone | Description | Signals Completion |
|-----------|-------------|-------------------|
| **First Voice** | OpenAI Realtime working end-to-end | Voice conversation with robot |
| **First Memory** | Robot remembers across sessions | References past conversation |
| **First Proactive** | Robot initiates interaction | Greets without prompt |
| **Multi-Provider** | 2+ providers working | Switch providers mid-session |
| **Persona v1** | Full customization | Create unique personality |
| **Integration v1** | External data flows in | Calendar alerts work |
| **Shareable** | Others can use your persona | Export/import works |
