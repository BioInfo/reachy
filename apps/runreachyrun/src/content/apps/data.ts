import { AppPage } from "@/types";

export const appsData: AppPage[] = [
  {
    slug: "focus-guardian",
    title: "Focus Guardian",
    tagline: "Your robot accountability partner",
    description:
      "A productivity body-double app that uses Reachy Mini as an accountability partner. The robot watches you work, notices when you get distracted, and provides gentle encouragement through expressions and movements. Based on the body-doubling technique used for ADHD focus.",
    status: "live",
    icon: "Target",

    huggingFaceUrl: "https://huggingface.co/spaces/RyeCatcher/focus-guardian",
    githubUrl: "https://github.com/BioInfo/reachy/tree/main/apps/focus-guardian",

    screenshots: [],

    features: [
      {
        icon: "Eye",
        title: "Attention Tracking",
        description:
          "Uses head pose detection to notice when you look away from your screen. Reachy responds with curious or encouraging expressions.",
      },
      {
        icon: "Timer",
        title: "Pomodoro Sessions",
        description:
          "Built-in focus timer with customizable work/break intervals. Reachy celebrates completed sessions with antenna wiggles.",
      },
      {
        icon: "Smile",
        title: "Expressive Feedback",
        description:
          "A library of robot expressions — encouraging nods, playful tilts, celebratory antenna dances — that respond to your focus state.",
      },
      {
        icon: "BarChart3",
        title: "Session Analytics",
        description:
          "Track your focus patterns over time. See when you're most productive and what breaks your concentration.",
      },
    ],

    howItWorks: [
      {
        step: 1,
        title: "Start a Focus Session",
        description:
          "Launch the app and set your work duration. Reachy settles into 'focus mode' — attentive but calm.",
      },
      {
        step: 2,
        title: "Work While Watched",
        description:
          "The camera tracks your head pose. As long as you're focused, Reachy stays supportively still with occasional encouraging movements.",
      },
      {
        step: 3,
        title: "Get Gentle Nudges",
        description:
          "Look away too long? Reachy notices and gives you a gentle reminder — a head tilt, an antenna waggle, nothing aggressive.",
      },
      {
        step: 4,
        title: "Celebrate Completion",
        description:
          "Finish your session and Reachy celebrates with you. Take your break knowing you earned it.",
      },
    ],

    prerequisites: [
      "Reachy Mini Lite (physical robot or simulation)",
      "Python 3.10+",
      "Webcam for head pose detection",
      "Reachy daemon running on port 8000",
    ],

    quickStart: `# Clone the repo
git clone https://github.com/BioInfo/reachy.git
cd reachy/apps/focus-guardian

# Install dependencies
pip install -r requirements.txt

# Run with simulation
python app.py --simulation

# Run with physical robot
python app.py`,

    configuration: `# config.py options
WORK_DURATION = 25  # minutes
BREAK_DURATION = 5  # minutes
DISTRACTION_THRESHOLD = 3  # seconds before nudge
CELEBRATION_INTENSITY = "medium"  # low, medium, high`,

    troubleshooting: [
      {
        problem: "Camera not detected",
        solution:
          "Ensure your webcam is connected and not in use by another app. Try specifying the camera index: --camera 1",
      },
      {
        problem: "Robot not responding",
        solution:
          "Check that the Reachy daemon is running: curl http://localhost:8000/health-check",
      },
      {
        problem: "Head pose jittery",
        solution:
          "Improve lighting conditions. The head pose model works best with even, front-facing light.",
      },
    ],

    techStack: ["Python", "Gradio", "MediaPipe", "OpenCV", "Reachy SDK"],

    journalEntries: ["focus-guardian-prd", "camera-debugging"],
    timelineNodes: ["focus-guardian-concept", "camera-issues"],

    claudeContributions: [
      {
        title: "Expression System Design",
        description:
          "Designed the mapping between focus states and robot expressions. Created a library of 12 distinct expressions with smooth transitions.",
        prompt:
          "Help me design expressions that feel supportive, not judgmental",
      },
      {
        title: "Head Pose Integration",
        description:
          "Integrated MediaPipe face mesh for real-time head pose estimation. Handles edge cases like partial face visibility.",
      },
    ],

    learnings: [
      "Body-doubling works even with robots — the sense of 'being watched' helps focus",
      "Expressions need to be subtle; too much movement becomes distracting",
      "Head pose detection is surprisingly sensitive to lighting conditions",
    ],

    lastUpdated: "2025-12-21",
  },

  {
    slug: "dj-reactor",
    title: "DJ Reactor",
    tagline: "Reachy reacts to your music",
    description:
      "An audio-reactive experience where Reachy Mini responds to music in real-time. The robot analyzes audio frequencies, detects beats, and translates sound into synchronized movements — head bobs, antenna waggles, and LED color changes.",
    status: "live",
    icon: "Music",

    huggingFaceUrl: "https://huggingface.co/spaces/RyeCatcher/dj-reactor",
    githubUrl: "https://github.com/BioInfo/reachy/tree/main/apps/dj-reactor",

    screenshots: [],

    features: [
      {
        icon: "AudioWaveform",
        title: "Real-time Audio Analysis",
        description:
          "Processes audio input in real-time using FFT. Separates frequencies into bass, mid, and treble bands for nuanced reactions.",
      },
      {
        icon: "Disc3",
        title: "Beat Detection",
        description:
          "Identifies beats and tempo changes. Reachy bobs its head on the beat and adjusts movement intensity to the music's energy.",
      },
      {
        icon: "Palette",
        title: "LED Visualization",
        description:
          "Antenna LEDs change color based on frequency spectrum. Bass pulses red, mids glow green, highs shimmer blue.",
      },
      {
        icon: "Sparkles",
        title: "Movement Library",
        description:
          "Pre-choreographed movement patterns that blend based on audio characteristics. From subtle vibes to full party mode.",
      },
    ],

    howItWorks: [
      {
        step: 1,
        title: "Audio Input",
        description:
          "Feed audio from your microphone, system audio, or a direct file. The app captures a continuous audio stream.",
      },
      {
        step: 2,
        title: "Frequency Analysis",
        description:
          "FFT breaks the audio into frequency bands. Each band maps to different robot behaviors — bass to head movement, highs to antenna speed.",
      },
      {
        step: 3,
        title: "Beat Sync",
        description:
          "Onset detection identifies beats. The robot's movements synchronize to the rhythm, staying on beat even when you can't.",
      },
      {
        step: 4,
        title: "Expressive Output",
        description:
          "Head position, antenna angles, and LED colors all update in real-time. The result: a dancing robot DJ.",
      },
    ],

    prerequisites: [
      "Reachy Mini Lite (physical robot or simulation)",
      "Python 3.10+",
      "Audio input (microphone or system audio)",
      "Reachy daemon running on port 8000",
    ],

    quickStart: `# Clone the repo
git clone https://github.com/BioInfo/reachy.git
cd reachy/apps/dj-reactor

# Install dependencies
pip install -r requirements.txt

# Run with microphone input
python app.py --input mic

# Run with audio file
python app.py --input file --file path/to/song.mp3`,

    configuration: `# config.py options
AUDIO_INPUT = "mic"  # mic, system, file
SENSITIVITY = 0.7  # 0.0-1.0, how reactive
MOVEMENT_SCALE = 1.0  # movement amplitude multiplier
LED_ENABLED = True
BEAT_SYNC = True`,

    troubleshooting: [
      {
        problem: "No audio detected",
        solution:
          "Check your audio input device. On macOS, you may need to grant microphone permissions in System Preferences.",
      },
      {
        problem: "Movements lag behind music",
        solution:
          "Reduce the FFT window size in config.py for lower latency. Trade-off is less frequency resolution.",
      },
      {
        problem: "LEDs not changing",
        solution:
          "LED control requires the physical robot. In simulation mode, LED changes are logged but not visible.",
      },
    ],

    techStack: ["Python", "Gradio", "NumPy", "librosa", "Reachy SDK"],

    journalEntries: ["dj-reactor-start"],
    timelineNodes: ["dj-reactor-start"],

    claudeContributions: [
      {
        title: "Audio Pipeline Architecture",
        description:
          "Designed the real-time audio processing pipeline with buffering, FFT analysis, and movement generation running in parallel threads.",
        prompt: "How do I process audio in real-time without blocking the robot control loop?",
      },
      {
        title: "Movement Choreography",
        description:
          "Created parametric movement functions that blend smoothly based on audio intensity. Prevents jerky transitions between states.",
      },
    ],

    learnings: [
      "Real-time audio requires careful buffer management — too small and you miss beats, too large and you add latency",
      "Robots dancing is surprisingly delightful, even with limited degrees of freedom",
      "The antenna waggle is the secret weapon — it's expressive with minimal motor wear",
    ],

    lastUpdated: "2025-12-20",
  },

  {
    slug: "reachy-echo",
    title: "Reachy Echo",
    tagline: "A companion that remembers you",
    description:
      "Echo transforms Reachy Mini from a voice assistant into a companion that builds a relationship with you. It remembers your name, preferences, and what you worked on yesterday. Unlike reactive assistants, Echo initiates — greeting you in the morning, suggesting breaks, celebrating your wins.",
    status: "development",
    icon: "MessageCircle",

    githubUrl: "https://github.com/BioInfo/reachy/tree/main/apps/echo",

    screenshots: [],

    features: [
      {
        icon: "Brain",
        title: "Persistent Memory",
        description:
          "SQLite-backed memory stores facts about you, conversation history, and session summaries. Echo knows your name, work, and preferences across sessions.",
      },
      {
        icon: "Sparkles",
        title: "Proactive Behaviors",
        description:
          "Doesn't just respond — initiates. Morning greetings, work break reminders, build celebration dances. Trigger-based engine with cooldowns to avoid being annoying.",
      },
      {
        icon: "Server",
        title: "Multi-Model Backend",
        description:
          "LiteLLM integration supports 18+ models via DGX Spark: Llama 3.3 70B (Cerebras), Claude Opus 4.5, GPT-5.2, Gemini 3 Pro. Hot-swap models mid-conversation.",
      },
      {
        icon: "Heart",
        title: "Emotional Expression",
        description:
          "Movement that communicates, not decorates. Antenna wiggles on responses, celebration dances on achievements, attentive poses during conversation.",
      },
    ],

    howItWorks: [
      {
        step: 1,
        title: "First Meeting",
        description:
          "Echo asks your name and learns about you through natural conversation. Facts are extracted and stored automatically.",
      },
      {
        step: 2,
        title: "Building Relationship",
        description:
          "Each conversation adds to Echo's understanding. It remembers topics you care about, projects you mention, preferences you express.",
      },
      {
        step: 3,
        title: "Proactive Engagement",
        description:
          "Based on time, context, and learned patterns, Echo initiates interactions. Good morning greetings, break reminders after long focus sessions.",
      },
      {
        step: 4,
        title: "Growing Together",
        description:
          "Over time, Echo becomes more personalized. It knows when you need encouragement vs space, celebrates your wins, supports during setbacks.",
      },
    ],

    prerequisites: [
      "Reachy Mini Lite (physical robot)",
      "Python 3.10+",
      "LiteLLM backend (local or cloud)",
      "Reachy daemon running on port 8000",
    ],

    quickStart: `# Currently in development
# MVP complete, polishing before release

# Architecture:
# - LiteLLM provider (18 models via DGX Spark)
# - SQLite memory (facts, sessions, messages)
# - Proactive behavior engine (triggers + cooldowns)
# - Gradio 6 UI with model selector`,

    techStack: ["Python", "Gradio 6", "LiteLLM", "SQLite", "Reachy SDK"],

    journalEntries: [],
    timelineNodes: ["reachy-echo-mvp-20251222"],

    claudeContributions: [
      {
        title: "Memory Architecture",
        description:
          "Designed the three-table SQLite schema: user_facts (persistent knowledge), conversation_sessions (summaries), daily_log (greeting tracking). Automatic fact extraction from conversation.",
      },
      {
        title: "Proactive Engine",
        description:
          "Built the trigger-based behavior system with time/duration/pattern/presence triggers. Cooldown management prevents the robot from being annoying.",
      },
      {
        title: "LiteLLM Integration",
        description:
          "Connected to DGX Spark's LiteLLM proxy with 18 models. Hot-swap capability lets users switch between fast local inference and powerful cloud models.",
      },
    ],

    learnings: [
      "Memory transforms assistants into companions — knowing someone's name changes everything",
      "Proactive engagement needs careful rate limiting; too eager becomes annoying",
      "Local LLM inference (Cerebras Llama 3.3 70B) is fast enough for real-time conversation",
    ],

    lastUpdated: "2025-12-22",
  },
];

// Helper functions
export function getAppBySlug(slug: string): AppPage | undefined {
  return appsData.find((app) => app.slug === slug);
}

export function getAllAppSlugs(): string[] {
  return appsData.map((app) => app.slug);
}

export function getAppsByStatus(status: AppPage["status"]): AppPage[] {
  return appsData.filter((app) => app.status === status);
}
