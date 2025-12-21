# Reachy Mini App Ideas Roadmap

Comprehensive brainstorm of app ideas for Reachy Mini robot, organized by category and camera requirements.

**Last Updated:** 2025-12-18
**Status:** Living document - iterate as we build

---

## Core Design Principles

### What Makes Robot Apps Compelling

A robot is NOT just a fancy speaker. Apps should leverage:

1. **Physical Presence** - Takes up space, demands attention, proves "someone is there"
2. **Gaze & Attention** - Can meaningfully look at things, track, follow
3. **Body Language** - Expresses emotion through movement (not just voice)
4. **Spatial Awareness** - Orients toward sounds, people, events
5. **Social Bonding** - People anthropomorphize, form emotional connections
6. **Ambient Behavior** - Can be "doing something" even when not engaged

### Anti-Patterns to Avoid

- Chat interfaces that could just be a phone app
- Static apps that don't use movement
- Apps that ignore the physical presence value
- Gimmicks without sustained engagement

---

## NO-CAMERA APPS (Build Now)

These can be developed immediately in simulation or headless mode.

### Tier 1: High Impact, Unique to Robots

#### 1. Pomodoro Body Double
**Concept:** Not just a timer—a physical accountability partner that "works alongside you."

**Why It's Special:** The robot's physical presence creates social accountability. Studies show body doubling (having someone present while you work) dramatically helps focus, especially for ADHD.

**Behaviors:**
- "Working" mode: Subtle head movements, occasional glances at you
- Break time: Excited antenna wiggles, celebratory sounds
- Break over: Gentle "let's get back to it" nudge
- Skip break: Concerned/disappointed expression
- Deep focus detected (no keyboard for minutes): Patient waiting pose

**Technical:** Audio detection for keyboard/mouse, timers, state machine for modes.

---

#### 2. Meeting Buddy
**Concept:** Listens to meetings, nods along, looks toward speaker direction, gives physical reactions.

**Why It's Special:** Makes video calls less isolating. Provides physical presence in remote work.

**Behaviors:**
- Uses 4-mic array for speaker direction detection
- Nods along to speech patterns
- Surprised reaction to loud voices or exclamations
- Looks "thoughtful" during pauses
- Celebrates when meeting ends

**Technical:** Audio direction detection, speech pattern analysis, meeting detection.

---

#### 3. DJ Reactor / Music Visualizer
**Concept:** Analyzes music and moves expressively to the beat. Different personalities for genres.

**Why It's Special:** Transforms music listening into shared experience. Physical visualization of sound.

**Behaviors:**
- Beat detection drives body rotation and head bobs
- Antenna movement on high frequencies
- Genre-specific styles (head bang for rock, smooth sway for jazz)
- "Vibing" idle animations
- Reacts to drops, builds, silence

**Technical:** Audio FFT analysis, beat detection, genre classification (optional HF model).

---

#### 4. Breathing Guide / Meditation Anchor
**Concept:** Physical breathing exercises where robot's movement guides inhale/exhale.

**Why It's Special:** Having something physical to follow is more grounding than screen animations.

**Behaviors:**
- Slow head rise = inhale, slow head lower = exhale
- Antenna spread on inhale, relax on exhale
- Body rotation for body scan meditation
- Progressive relaxation sequences
- Calming LED eye patterns

**Technical:** Timed movement sequences, audio cues, breathing pattern library.

---

#### 5. Notification Concierge
**Concept:** Receives system notifications, triages by importance, physically alerts with appropriate urgency.

**Why It's Special:** Breaks notification addiction by adding friction + physical representation of interruption.

**Behaviors:**
- Slack message from boss: Alert pose, looks at you insistently
- Social media: Casual glance, dismissive antenna flick
- Calendar reminder: Helpful reminder pose
- Emergency: Full attention-grabbing sequence
- Batches low-priority for scheduled check-ins

**Technical:** System notification API integration, priority classification, queue management.

---

### Tier 2: Entertainment & Fun

#### 6. Pet Simulator
**Concept:** Robot behaves like different animals with distinct personalities.

**Modes:**
- **Cat:** Curious head tilts, ignores you sometimes, demands attention randomly
- **Dog:** Excited, always attentive, happy wiggles
- **Owl:** Wise, slow movements, dramatic head rotations
- **Parrot:** Mimics sounds, bobbing, repeats phrases
- **Sleepy Sloth:** Minimal movement, occasional yawn

**Technical:** Personality state machines, random event triggers, learned preferences.

---

#### 7. Story Narrator
**Concept:** Tells stories with dramatic head movements, voices, and physical acting.

**Behaviors:**
- Different character voices with matching movement styles
- Suspense building (slow, tense movements)
- Action sequences (rapid movements)
- Emotional moments (appropriate expressions)
- Interactive: asks audience to make choices

**Technical:** Story format with movement annotations, TTS integration, branching narratives.

---

#### 8. Dance Party
**Concept:** Pre-choreographed dances to popular songs that users can trigger or request.

**Features:**
- Library of choreographed routines
- "Learn a dance" mode (gravity comp + recording)
- Duet mode (robot mirrors your movements... for camera version)
- Community dance sharing on HuggingFace

**Technical:** Choreography format, music sync, motion library.

---

#### 9. Game Master / D&D Companion
**Concept:** Dungeon Master assistant that rolls dice dramatically and reacts to results.

**Behaviors:**
- Dramatic dice roll announcements with building tension
- Celebrates critical hits (nat 20)
- Commiserates on failures (nat 1)
- Tracks initiative, HP, conditions
- Atmospheric mode for different encounters

**Technical:** RPG system integration, dramatic timing sequences, voice synthesis.

---

#### 10. Karaoke Judge
**Concept:** Listens to singing and gives physical reactions like a talent show judge.

**Behaviors:**
- Nods along when on pitch
- Cringes at bad notes (gentle, encouraging)
- Standing ovation for great performances
- "Golden buzzer" moment for exceptional singing
- Scoring and feedback

**Technical:** Pitch detection, music alignment, performance scoring.

---

### Tier 3: Productivity & Wellness

#### 11. Morning Greeter
**Concept:** Personalized wake-up routine that evolves with your schedule.

**Sequence:**
- Gentle wake animation
- Weather briefing with matching mood
- Calendar overview with appropriate urgency
- Motivation quote / intention setting
- "Ready to start the day" send-off

**Technical:** Calendar API, weather API, time-based triggers, user preferences.

---

#### 12. Wind Down Ritual
**Concept:** End-of-day routine that helps you decompress and review.

**Sequence:**
- "How was your day?" check-in
- Accomplishment celebration
- Tomorrow preview
- Gratitude prompt
- Progressive relaxation into sleep mode

**Technical:** Daily summary tracking, journaling integration, gradual movement slowdown.

---

#### 13. Stretch Reminder
**Concept:** Periodically demonstrates stretches with head/body movements.

**Behaviors:**
- Detects extended sitting (no movement detected)
- Demonstrates neck rolls, shoulder shrugs, body twists
- Guides breathing through stretches
- Celebrates completion
- Tracks stretch history

**Technical:** Activity detection, stretch library, reminder scheduling.

---

#### 14. Language Practice Buddy
**Concept:** Pronunciation coach that nods/shakes based on accuracy.

**Behaviors:**
- Says word in target language
- Listens to your attempt
- Visual feedback: nodding (good), head tilt (close), gentle shake (try again)
- Encouraging expressions for improvement
- Tracks progress, adjusts difficulty

**Technical:** Speech recognition, pronunciation scoring, spaced repetition.

---

#### 15. Voice Journal Witness
**Concept:** Silent witness for voice journaling that makes the practice feel less weird.

**Behaviors:**
- Attentive listening pose
- Subtle nods of acknowledgment
- Emotional mirroring based on tone analysis
- End-of-entry summary confirmation
- Never judges, always supportive

**Technical:** Voice activity detection, sentiment analysis, transcription (optional).

---

### Tier 4: Ambient & Decorative

#### 16. Weather Reactor
**Concept:** Connects to weather API, physically represents current conditions.

**Modes:**
- Sunny: Alert, happy, occasional "looking at sun" pose
- Rainy: Droopy, looking down, slow movements
- Stormy: Startled reactions to "thunder"
- Windy: Swaying, antennas blown back
- Snowy: Slow, peaceful, occasional shiver

**Technical:** Weather API integration, condition-based animation sets.

---

#### 17. Clock Mode
**Concept:** Marks time with periodic movements and hourly chimes.

**Behaviors:**
- Subtle "breathing" at rest
- Quarter-hour acknowledgment
- Hourly chime with special movement
- Dawn/dusk transitions
- Special animations for significant times (noon, midnight)

**Technical:** Time-based triggers, movement sequences, optional sound design.

---

#### 18. Lava Lamp Mode
**Concept:** Hypnotic, random slow movements for ambiance.

**Behaviors:**
- Smooth, continuous, unpredictable movement
- No sudden changes
- Gentle color/eye transitions
- Can respond subtly to sound
- "Living decoration" aesthetic

**Technical:** Perlin noise for movement, slow interpolation, ambient sound response.

---

#### 19. Social Media Reactor
**Concept:** Reads notifications and physically reacts to engagement.

**Behaviors:**
- New like: Happy ear perk
- New comment: Curious head tilt
- New follower: Excited celebration
- Going viral: Increasingly frantic excitement
- Negative comment: Protective/dismissive gesture

**Technical:** Social media API integration, notification parsing, emotional mapping.

---

### Tier 5: Games & Interactive

#### 20. Rock Paper Scissors
**Concept:** Classic game using antenna and head positions.

**Gestures:**
- Rock: Head down, antennas tucked
- Paper: Head up, antennas spread wide
- Scissors: Antennas crossed like scissors

**Technical:** Gesture library, game logic, win/lose reactions.

---

#### 21. Simon Says
**Concept:** Robot leads Simon Says with head/body movements.

**Gameplay:**
- Robot demonstrates sequence of movements
- Player must remember and describe/mimic
- Increasingly complex sequences
- Tricky "Simon didn't say" moments
- Celebration/commiseration on results

**Technical:** Sequence generation, difficulty progression, voice command detection.

---

#### 22. 20 Questions
**Concept:** Expressive version of the classic guessing game.

**Behaviors:**
- Thinking pose when considering
- Excited when getting close
- Frustrated when player is way off
- Dramatic reveal of answer
- Tracks win/loss record

**Technical:** Knowledge base or LLM integration, emotional state machine.

---

#### 23. Truth Detector (Party Game)
**Concept:** Fun "lie detector" game with dramatic reactions.

**Behaviors:**
- Stares intently during answer
- Suspicious squinting
- "AHA!" caught-you reaction
- "Hmm, seems legit" acceptance
- Purely entertainment (not real detection)

**Technical:** Random with theatrical timing, voice stress analysis (fake), drama sequences.

---

---

## CAMERA APPS (Computer Vision Required)

Require camera access - build after headless camera workaround or with physical robot.

### Tier 1: High Impact Vision Apps

#### 24. Attention Guardian (Focus Guardian v2)
**Concept:** Knows when you're looking at screen vs distracted, provides gentle accountability.

**Behaviors:**
- Tracks face/gaze direction
- Notices when attention wanders
- Gentle "ahem" to refocus
- Celebrates sustained focus sessions
- Learns your patterns, adapts

**Technical:** Face detection, gaze estimation, attention scoring, adaptive thresholds.

---

#### 25. Posture Coach
**Concept:** Monitors posture, reminds you to sit up straight.

**Behaviors:**
- Baseline calibration of good posture
- Detects slouching, forward head
- Mirrors bad posture mockingly
- Celebrates posture improvement
- Tracks posture score over time

**Technical:** Pose estimation, posture classification, personalized baseline.

---

#### 26. Emotion Mirror
**Concept:** Detects your facial emotions, mirrors them back expressively.

**Behaviors:**
- Real-time emotion detection
- Exaggerated mirroring (you smile, robot beams)
- Empathetic response to negative emotions
- "Cheer up" attempts when you're sad
- Shared excitement, shared concern

**Technical:** Facial emotion detection (HF model), emotion-to-movement mapping.

---

#### 27. Photo Booth Director
**Concept:** Directs group photos with timing, positioning, and smile detection.

**Behaviors:**
- "Everyone squeeze in!"
- Looks at each person, confirms ready
- Smile detection → triggers countdown
- Dramatic countdown with head movements
- "Got it!" celebration

**Technical:** Face detection, smile detection, group positioning analysis.

---

#### 28. Mirror Mode (Copycat)
**Concept:** Real-time head movement mirroring—you move, robot follows.

**Use Cases:**
- Entertainment and bonding
- Testing movement feel
- "Robot puppet" performance
- Teleconference proxy

**Technical:** Head pose estimation, real-time movement mapping, latency optimization.

---

### Tier 2: Practical Vision Apps

#### 29. Screen Break Enforcer
**Concept:** Detects continuous screen staring, physically intervenes.

**Behaviors:**
- Tracks screen gaze duration
- Warning: gets in your peripheral vision
- Break time: physically "blocks" your view by getting attention
- Celebrates when you take breaks
- Tracks screen time stats

**Technical:** Face/gaze tracking, screen time accounting, escalating intervention.

---

#### 30. Object Finder
**Concept:** Helps locate objects in view.

**Usage:**
- "Where are my keys?"
- Scans visible area
- Points toward detected object
- "I see them over there!" with direction indication

**Technical:** Object detection (YOLO/etc), spatial mapping, pointing behavior.

---

#### 31. Reading Companion
**Concept:** Follows along as you read physical books.

**Behaviors:**
- Detects book/page
- Tracks your reading position (eye movement or page turns)
- Reacts to your expressions while reading
- "Page turn" anticipation
- Remembers where you left off

**Technical:** Document detection, reading activity detection, session memory.

---

#### 32. Presentation Practice Coach
**Concept:** Watches you practice presentations, provides feedback.

**Behaviors:**
- Tracks eye contact (are you reading notes?)
- Monitors pacing and pausing
- Reacts as engaged audience member
- Provides feedback on body language
- Simulates tough crowd or supportive crowd

**Technical:** Gaze tracking, speech analysis, posture evaluation, feedback generation.

---

### Tier 3: Fun Vision Apps

#### 33. Staring Contest
**Concept:** Classic game with blink detection.

**Gameplay:**
- Intense stare-off
- Blink detection for win/loss
- Increasingly difficult (robot "tricks" to make you blink)
- Dramatic victory/defeat reactions
- Leaderboard

**Technical:** Blink detection, timing, difficulty progression.

---

#### 34. Hide and Seek
**Concept:** Find hidden objects or play hide and seek.

**Modes:**
- Object finding with hot/cold hints
- Person finding (robot seeks)
- Robot hides (gives clues)

**Technical:** Object detection, spatial reasoning, progressive hints.

---

#### 35. Art Critic
**Concept:** Views artwork, gives dramatic opinions.

**Behaviors:**
- Leans in to examine closely
- Thoughtful pose
- Dramatic reactions to art
- Generated (humorous) art criticism
- Different critic personalities (harsh, encouraging, pretentious)

**Technical:** Image analysis, art description generation, personality-based responses.

---

### Tier 4: Accessibility & Health Vision Apps

#### 36. Sign Language Responder
**Concept:** Recognizes basic signs, responds appropriately.

**Behaviors:**
- Recognizes common signs (hello, thank you, yes, no)
- Responds with voice and matching movement
- Learning mode to teach signs
- Practice mode with feedback

**Technical:** Sign language recognition model, response mapping.

---

#### 37. Exercise Form Checker
**Concept:** Watches exercises, indicates good/bad form.

**Use Cases:**
- Desk exercises (neck, shoulders)
- Standing stretches
- Simple movements in view

**Behaviors:**
- Demonstrates exercise
- Watches you perform
- Real-time feedback (nod for good, concern for bad)
- Counts reps
- Celebrates completion

**Technical:** Pose estimation, form comparison, exercise library.

---

#### 38. Medication Reminder with Confirmation
**Concept:** Reminds you to take meds AND confirms you did.

**Behaviors:**
- Time-based reminder
- Watches for pill bottle
- Confirms medication taken
- Logs compliance
- Escalating reminders if missed

**Technical:** Object detection, activity confirmation, compliance logging.

---

---

## HUGGINGFACE MODEL INTEGRATION IDEAS

Leverage the 1.7M+ models on HuggingFace Hub.

### Vision Models

| App Idea | Model Type | Integration |
|----------|-----------|-------------|
| Emotion Mirror | Facial emotion detection | Real-time mirroring |
| Object Narrator | Image captioning + LLM | Tell stories about objects |
| Scene Describer | Image-to-text | Accessibility descriptions |
| Fashion Advisor | Clothing detection + LLM | Outfit commentary |
| Plant Identifier | Plant classification | Care advice |
| Animal Identifier | Animal classification | "Nature documentary" mode |

### Audio Models

| App Idea | Model Type | Integration |
|----------|-----------|-------------|
| Music Genre Reactor | Audio classification | Genre-specific movements |
| Language Detector | Language ID | Switch languages dynamically |
| Emotion from Voice | Speech emotion | Empathetic responses |
| Speaker Diarization | Who spoke | Track multiple people |

### Language Models

| App Idea | Model Type | Integration |
|----------|-----------|-------------|
| Story Generator | Text generation | Dynamic storytelling |
| Conversation | Chat models | Personality-rich dialogue |
| Joke Teller | Creative generation | Comedy with timing |
| Trivia Master | QA models | Quiz game host |

---

## UNIQUE ROBOT-SPECIFIC CONCEPTS

These ideas specifically leverage *physical presence* as the core value.

### The "Body Double" Category

For ADHD/focus support, the presence of another "person" working alongside dramatically helps. A robot can provide this without social overhead.

1. **Silent Work Partner** - Just exists. Appears to be working. Occasional glances.
2. **Study Buddy** - Same, but for studying. Quiet encouragement.
3. **Lonely Dinner Companion** - Keeps you company during meals.
4. **Night Watch** - Stays "awake," provides comfort someone's watching over.
5. **Grief Companion** - Physical presence for comfort, not conversation.

### The "Witness" Category

Having a witness changes behavior. Robot as non-judgmental observer.

1. **Gratitude Witness** - Daily gratitude practice with physical acknowledgment
2. **Goal Witness** - Declare goals, robot remembers and checks in
3. **Habit Witness** - Watches you do habits, celebrates streaks
4. **Commitment Device** - Tell robot your commitment, it holds you to it

### The "Proxy" Category

Robot represents someone else's presence.

1. **Remote Presence Proxy** - Family member "visits" through robot's gaze
2. **Deceased Loved One Memorial** - Gentle presence, not impersonation
3. **Future Self Ambassador** - Represents your future self's interests

### The "Ambient Intelligence" Category

Robot as physical manifestation of digital information.

1. **Team Mood Meter** - Represents team Slack sentiment physically
2. **Project Health Indicator** - Green/happy when CI passing, stressed when failing
3. **Email Anxiety Level** - Physical representation of inbox state
4. **Focus Time Guardian** - Blocks interruptions physically during deep work

---

## PRIORITIZED BUILD ORDER

### Phase 1: No Camera, High Impact (Build First)
1. **Pomodoro Body Double** - Core focus/productivity value
2. **DJ Reactor** - Fun, demos movement capabilities
3. **Breathing Guide** - Wellness, simple but powerful
4. **Pet Simulator** - Personality showcase
5. **Morning Greeter** - Daily ritual establishment

### Phase 2: No Camera, Entertainment
6. **Story Narrator** - Content platform
7. **Game Master** - Niche but passionate audience
8. **Dance Party** - Viral potential
9. **Weather Reactor** - Always-on ambient mode
10. **Notification Concierge** - Productivity integration

### Phase 3: Camera Apps
11. **Attention Guardian** - Core productivity (if camera works)
12. **Emotion Mirror** - Viral demo potential
13. **Posture Coach** - Health value
14. **Photo Booth Director** - Social/family use
15. **Staring Contest** - Simple, fun game

### Phase 4: Advanced Integration
16. **Meeting Buddy** - Enterprise value
17. **Language Practice** - Education market
18. **Sign Language Responder** - Accessibility
19. **Exercise Form Checker** - Health tech

---

## NEXT STEPS

1. **Pick 1-2 Phase 1 apps** to prototype
2. **Define PRD** for selected app
3. **Build MVP** in simulation
4. **Test with physical robot** when camera issue resolved
5. **Iterate based on usage**
6. **Publish to HuggingFace** community

---

## EVALUATION CRITERIA

When selecting which app to build, score on:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Uniqueness | 30% | Could this ONLY work as a robot? |
| Engagement | 25% | Will people use it repeatedly? |
| Technical Feasibility | 20% | Can we build it with current SDK? |
| Viral Potential | 15% | Will people share videos of it? |
| Personal Interest | 10% | Do WE want to use it? |

---

## SOURCES & INSPIRATION

Research conducted 2025-12-18:
- [Reachy Mini HuggingFace Blog](https://huggingface.co/blog/reachy-mini)
- [Pollen Robotics Official Site](https://www.pollen-robotics.com/reachy-mini/)
- [GitHub SDK Repository](https://github.com/pollen-robotics/reachy_mini)
- [Make and Publish Apps Tutorial](https://huggingface.co/blog/pollen-robotics/make-and-publish-your-reachy-mini-apps)
- [TechCrunch Coverage](https://techcrunch.com/2025/07/09/hugging-face-opens-up-orders-for-its-reachy-mini-desktop-robots/)

---

*This is a living document. Add ideas, refine priorities, and track progress as we build.*
