# Feature Candidates

All brainstormed features, organized by tier and category.

---

## Tier 1: Core Differentiators

These are the features that make this app fundamentally different from the Pollen app.

### 1.1 Multi-Backend Architecture

Support multiple LLM providers with hot-swap capability:

| Provider | Use Case | Notes |
|----------|----------|-------|
| **OpenAI Realtime** | Best voice quality, most capable | Current gold standard |
| **Gemini Live** | Google's multimodal streaming | Competitive features, different strengths |
| **Ollama** | Local LLMs (Llama, Mistral, etc.) | Privacy, offline, free |
| **LM Studio** | Local with nice UI | User-friendly local option |

Features:
- Hot-swap providers without restarting
- Fallback chains (primary → backup)
- Capability detection (not all providers support all features)
- Cost tracking and optimization

### 1.2 Persistent Memory & Relationship

Every interaction builds relationship:

| Memory Type | Content | Example |
|-------------|---------|---------|
| **Episodic** | Specific events/conversations | "We debugged that async issue on Tuesday" |
| **Semantic** | User facts/preferences | "You prefer dark mode, work late, love coffee" |
| **Procedural** | Learned behaviors | Custom greetings, preferred interaction styles |

Features:
- Natural history references in conversation
- Preference learning over time
- Emotional continuity (remembers mood states)
- Relationship progression (Day 1 vs Day 100 feels different)
- "What do you remember about me?" introspection

### 1.3 Proactive Companion Behaviors

Robot initiates interactions based on context:

| Behavior | Trigger | Action |
|----------|---------|--------|
| Morning Greeting | Face detected, first today | Personalized hello, day preview |
| Work Break Reminder | 3+ hours unbroken work | Gentle check-in, stretch suggestion |
| Success Celebration | Build success, tests pass | Excited reaction, congratulations |
| Frustration Support | Keyboard intensity, sighing | Empathetic check-in |
| End of Call | Silence after long audio | "How'd that meeting go?" |
| Calendar Alert | Upcoming event | "You have a 1:1 in 10 minutes" |
| Return Greeting | Face after 30+ min absence | "Welcome back!" |

---

## Tier 2: Enhanced Personalization

### 2.1 Persona Studio

Multi-dimensional persona customization:

| Dimension | Options |
|-----------|---------|
| **Voice** | Library selection, voice cloning (ElevenLabs/XTTS), local TTS |
| **Movement Style** | Energetic, calm, quirky, formal — affects gesture selection |
| **Emotional Mapping** | Define antenna/head behaviors for each emotion |
| **Expertise Domains** | Coding, wellness, language learning, productivity |
| **Relationship Dynamic** | Playful/serious, challenging/supportive, formal/casual |
| **Visual Identity** | LED accent colors, antenna "accessories" |
| **Language** | Primary language, code-switching patterns |

### 2.2 Skill System with Progression

Gamification for engagement:

- Robot "unlocks" new abilities over time
- User can teach custom behaviors/tools
- Achievement system:
  - 100 day streak
  - 50 pomodoros completed
  - First custom skill created
  - First proactive interaction
- Skill trees: focus on productivity, wellness, learning, entertainment
- Creates emotional investment and shareable moments

### 2.3 Custom Tool Creation

Let users extend functionality:

- Visual tool builder (no code required for simple tools)
- Python SDK for complex integrations
- Tool marketplace (share/discover)
- Template library for common patterns

---

## Tier 3: Integration & Context

### 3.1 Contextual Awareness Layer

| Integration | Capability |
|-------------|------------|
| **Calendar** | Event awareness, meeting prep, schedule queries |
| **GitHub/GitLab** | PR notifications, build status, review requests |
| **Slack/Teams** | Message notifications, focus mode responses |
| **Linear/Jira** | Task updates, sprint awareness |
| **Smart Home** | Lighting control, temperature, presence |
| **Music** | Playback control, mood-based suggestions |
| **Todoist/Things** | Task reminders, completion celebrations |

### 3.2 Focus & Wellness Features

| Feature | Description |
|---------|-------------|
| **Pomodoro Companion** | Physical presence cues, celebration on completion |
| **Posture Reminders** | Camera-based posture detection |
| **Breathing Exercises** | Synchronized antenna movements guide breathing |
| **Accountability Buddy** | Declared task tracking, gentle nudges |
| **Focus Mode** | "Should I hold your messages?" |
| **Break Activities** | Guided stretches, eye exercises |

### 3.3 Terminal/IDE Awareness

- Watch terminal output for patterns (build success, test failures)
- OCR screen reading for error detection
- "I see an error in your IDE — want help?"
- Context-aware coding assistance

---

## Tier 4: Multi-Modal Interaction

### 4.1 Gesture Recognition

| Gesture | Action |
|---------|--------|
| Wave | Get attention, start conversation |
| Thumbs up | Confirm, approve |
| Thumbs down | Reject, disagree |
| Open palm (stop) | Interrupt, pause |
| Point at something | "What's that?" |

### 4.2 Object Awareness

- Track objects on desk over time
- "Is that new thing a gift?"
- "You've had that coffee cup for 3 hours — refill time?"

### 4.3 Ambient Audio

| Sound | Response |
|-------|----------|
| Doorbell | Alert user, offer to pause |
| Phone ringing | Acknowledge, wait |
| Call ending | "How'd that go?" |
| Typing intensity | Frustration detection |
| Silence after activity | Check-in opportunity |

---

## Tier 5: Social & Community

### 5.1 Persona Marketplace

- Share custom personas
- Discover community creations
- Rate and review
- Verified creator program

### 5.2 Multi-Robot Features

- Robot-to-robot communication (household with multiple)
- "Visit" mode: friend's persona guest-stars
- Collaborative activities

### 5.3 Building in Public

- Export interaction highlights
- Shareable relationship milestones
- "Day X with Reachy" templates

---

## Tier 6: Accessibility

### 6.1 Hearing Accessibility

- Sign language recognition (stretch goal)
- Visual alerts for sounds (doorbell, phone, etc.)
- Vibration patterns for notifications (if hardware supports)

### 6.2 Vision Accessibility

- Voice-first design (works without looking)
- High contrast modes
- Screen reader friendly UI

### 6.3 Cognitive Accessibility

- Simple mode (reduced complexity)
- Predictable behavior patterns
- Clear feedback for all actions
- Adjustable interaction speed

---

## Feature Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Multi-backend support | High | Medium | P0 |
| Persistent memory | High | Medium | P0 |
| 3 proactive behaviors | High | Low | P0 |
| Enhanced persona (voice+motion) | Medium | Low | P0 |
| Full Persona Studio UI | Medium | High | P1 |
| Calendar integration | Medium | Low | P1 |
| Skill/achievement system | Medium | Medium | P2 |
| Gesture recognition | Low | High | P3 |
| Persona marketplace | Low | High | P3 |
