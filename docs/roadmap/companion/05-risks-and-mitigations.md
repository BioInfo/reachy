# Risks and Mitigations

## Technical Risks

### 1. Local Model Latency

**Risk:** Local LLMs (Ollama, LM Studio) may have unacceptable latency for real-time conversation, especially on consumer hardware.

**Impact:** High - Core feature (multi-backend) feels broken

**Mitigations:**
- Hybrid approach: Local for simple tasks, cloud for complex
- Aggressive prompt caching and KV cache reuse
- Smaller, faster models for conversational back-and-forth
- Stream tokens to TTS before completion (speculative response)
- Clear UI indication of "thinking" state
- Allow user to set quality/speed tradeoff

**Fallback:** Position local models as "privacy mode" with expected tradeoffs, not as equivalent to cloud.

---

### 2. Memory System Complexity

**Risk:** Building a robust memory system that feels natural is significantly harder than it appears. Risk of:
- Awkward/incorrect memory references
- Privacy concerns with stored data
- Storage bloat over time
- Slow retrieval as data grows

**Impact:** High - Core feature (persistent relationship) fails

**Mitigations:**
- Start simple: key-value facts before semantic search
- Explicit "I remember you mentioned X" phrasing (sets expectations)
- User-visible memory log ("What do you know about me?")
- Easy deletion/editing of memories
- Automatic summarization and pruning
- LanceDB handles vector search efficiently
- Regular memory consolidation (merge similar memories)

**Fallback:** Ship basic memory (facts + recent history) without semantic search if retrieval quality is poor.

---

### 3. Proactive Behavior Creepiness

**Risk:** The line between "thoughtful companion" and "surveillance" is thin. Proactive behaviors could feel intrusive or creepy.

**Impact:** Medium-High - Users disable features or abandon app

**Mitigations:**
- Explicit opt-in for each proactive feature during onboarding
- "Why did you say that?" explanation on demand
- Always-visible log of what robot noticed
- Easy per-feature toggle
- Conservative defaults (most behaviors off)
- Privacy mode (robot goes to sleep, no sensing)
- Clear visual indicator when robot is "watching" vs "idle"
- User controls trigger sensitivity

**Design Principle:** When in doubt, don't trigger. False negatives are better than false positives.

---

### 4. Provider API Instability

**Risk:** LLM providers (especially realtime/streaming APIs) change frequently. Gemini Live and OpenAI Realtime are both relatively new.

**Impact:** Medium - Features break after provider updates

**Mitigations:**
- Strong abstraction layer isolates changes
- Version pinning for provider SDKs
- Comprehensive integration tests per provider
- Fallback chain means one broken provider doesn't kill the app
- Monitor provider changelogs and deprecation notices
- Community can contribute provider fixes

**Fallback:** Maintain at least one stable provider (probably OpenAI) as reliable fallback.

---

### 5. Audio Pipeline Complexity

**Risk:** Real-time audio streaming with low latency is hard. Issues with echo cancellation, microphone handling, and audio artifacts.

**Impact:** Medium - Poor audio quality ruins experience

**Mitigations:**
- Build on proven fastrtc foundation from Pollen app
- WebRTC for browser-based audio when possible
- Extensive testing on different hardware configurations
- Audio diagnostics panel in settings
- Support for external microphones
- Clear documentation of audio setup

**Fallback:** Offer text-only mode as alternative interaction method.

---

### 6. Hardware Variability

**Risk:** Reachy Mini has hardware variations (camera quality, motor responsiveness) that could affect features differently.

**Impact:** Low-Medium - Features work for some users, not others

**Mitigations:**
- Feature detection at startup (camera available? motor calibration?)
- Graceful degradation when hardware is limited
- Clear error messages about missing capabilities
- Hardware compatibility matrix in documentation
- Simulation mode for development

---

## Product Risks

### 7. Scope Creep

**Risk:** The feature space is enormous. Easy to keep adding "one more thing" and never ship.

**Impact:** High - Never reach stable release

**Mitigations:**
- Strict MVP definition (Phase 1)
- User research gates between phases
- "Must have" vs "Nice to have" discipline
- Time-boxed exploration spikes
- Regular "would we ship today?" check-ins
- Cut scope before cutting quality

**Principle:** Better to ship a focused, polished MVP than a sprawling beta.

---

### 8. User Adoption

**Risk:** Reachy Mini has a small user base. Building elaborate features for handful of users may not be sustainable.

**Impact:** Medium - Effort doesn't translate to impact

**Mitigations:**
- Open source from day one (community contributions)
- Build for personal use first (dogfooding)
- Share progress publicly (building in public)
- Features that work without physical robot (simulation mode)
- Consider applicability to other robot platforms

**Reframe:** This is a learning project and portfolio piece, not a business.

---

### 9. Maintenance Burden

**Risk:** Multiple providers, integrations, and features create ongoing maintenance overhead.

**Impact:** Medium - Project becomes burdensome over time

**Mitigations:**
- Plugin architecture for extensions (community-maintained)
- Minimal core, optional extras
- Automated testing for regression detection
- Clear deprecation policies
- Documentation for contributors
- "Sustainability" as a design goal

---

## Security & Privacy Risks

### 10. API Key Exposure

**Risk:** Users may accidentally expose API keys through configuration files, logs, or screenshots.

**Impact:** High - Financial/security consequences for users

**Mitigations:**
- Environment variables for all secrets
- Never log API keys
- Mask keys in UI
- Clear documentation about key security
- .env file in .gitignore by default
- Key rotation reminders

---

### 11. Memory Privacy

**Risk:** Stored memories could contain sensitive information. Risk of:
- Unintended disclosure
- Inappropriate retention
- Data breach

**Impact:** High - Privacy violation, user trust lost

**Mitigations:**
- Local-first storage (never synced to cloud by default)
- Encryption at rest (optional but recommended)
- Easy bulk deletion
- No memory sharing without explicit export
- Clear data retention policy
- GDPR-style "right to be forgotten"

---

### 12. Integration Auth Leakage

**Risk:** Calendar, GitHub, Slack tokens could be mishandled.

**Impact:** High - Access to user's accounts

**Mitigations:**
- OAuth flows where possible (no password storage)
- Token stored in system keychain
- Minimal scopes requested
- Token refresh handling
- Clear "disconnect" option
- Audit log of integration access

---

## Risk Summary Matrix

| Risk | Likelihood | Impact | Priority |
|------|------------|--------|----------|
| Local model latency | High | High | P0 |
| Memory complexity | Medium | High | P0 |
| Proactive creepiness | Medium | High | P0 |
| Provider API changes | High | Medium | P1 |
| Scope creep | High | High | P1 |
| Audio pipeline issues | Medium | Medium | P2 |
| Memory privacy | Low | High | P2 |
| Hardware variability | Medium | Low | P3 |
| User adoption | Medium | Medium | P3 |
| Maintenance burden | Medium | Medium | P3 |

---

## Contingency Plans

### If OpenAI Realtime becomes unavailable:
1. Fall back to Gemini Live
2. Use standard OpenAI API + separate TTS/STT
3. Local models become primary

### If memory system doesn't feel natural:
1. Ship with simple fact storage only
2. Iterate on retrieval/injection prompts
3. Make memory references opt-in ("remind me...")

### If proactive features feel creepy:
1. Default to all-off, opt-in activation
2. Reduce to only user-requested triggers
3. Focus on time-based (calendar) not sensing-based

### If scope becomes unmanageable:
1. Freeze feature development
2. Focus on polish and documentation
3. Release what's stable as v1.0
