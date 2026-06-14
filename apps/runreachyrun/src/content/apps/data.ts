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

    huggingFaceUrl: "https://huggingface.co/spaces/RyeCatcher/focus_guardian",
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

    huggingFaceUrl: "https://huggingface.co/spaces/RyeCatcher/dj_reactor",
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
    slug: "hey-reachy",
    title: "Hey, Reachy",
    tagline: "Say hi, and the robot talks back",
    description:
      "A voice companion for Reachy Mini. Wake it with a word, talk, and it answers out loud from its own speaker, with a calm nod while it speaks. The robot's reaction is the product; the language model behind it is a pluggable, swappable engine.",
    status: "live",
    icon: "AudioLines",

    huggingFaceUrl: "https://huggingface.co/spaces/RyeCatcher/hey_reachy",
    githubUrl: "https://github.com/BioInfo/reachy/tree/main/apps/hey-reachy",

    screenshots: [],

    features: [
      {
        icon: "Mic",
        title: "Keyless wake word",
        description:
          "An open-source wake word (openWakeWord) wakes the robot. No cloud, no account, no API key to start listening.",
      },
      {
        icon: "Cpu",
        title: "Pluggable brain",
        description:
          "Conversation runs through one interface. Point it at any OpenAI-compatible model, or wire in your own agent. Swap the engine anytime.",
      },
      {
        icon: "Volume2",
        title: "Speaks from the robot",
        description:
          "Replies come out of Reachy's own speaker in a natural voice, and it keeps listening so you can go back and forth without re-waking it.",
      },
      {
        icon: "Bot",
        title: "Calm by design",
        description:
          "A small, slow head-nod while it speaks, antennas pinned, a level pose the rest of the time. Present, not fidgety.",
      },
    ],

    howItWorks: [
      {
        step: 1,
        title: "Wake",
        description:
          "Say the wake word. Reachy wakes and starts listening — keyless, on-device, no account.",
      },
      {
        step: 2,
        title: "Listen + transcribe",
        description:
          "Voice-activity detection captures your words and stops on silence, then transcribes through an OpenAI-compatible endpoint.",
      },
      {
        step: 3,
        title: "Think + speak",
        description:
          "A pluggable brain writes a short, spoken-style reply, and text-to-speech plays it from the robot's speaker.",
      },
      {
        step: 4,
        title: "React + continue",
        description:
          "A gentle nod while it talks, then it keeps listening for a few seconds so a back-and-forth needs no re-wake.",
      },
    ],

    prerequisites: [
      "Reachy Mini Lite (physical robot)",
      "Python 3.10+",
      "An OpenAI-compatible endpoint for chat + speech (your own gateway or provider)",
      "Reachy daemon running on port 8000",
    ],

    quickStart: `# Clone the repo
git clone https://github.com/BioInfo/reachy.git
cd reachy/apps/hey-reachy

# Install
pip install -e .

# Point it at your model + speech endpoint
export HEY_REACHY_LLM_BASE_URL=http://your-gateway:4000/v1
export HEY_REACHY_LLM_MODEL=your-model-id
export HEY_REACHY_LLM_API_KEY=your-key

# Start it from the dashboard, or:
curl -X POST http://127.0.0.1:8000/api/apps/start-app/hey_reachy`,

    configuration: `# environment (HEY_REACHY_*)
HEY_REACHY_OPENWW_MODEL=hey_jarvis   # keyless wake preset
HEY_REACHY_WAKE_THRESHOLD=0.4        # lower = more sensitive
HEY_REACHY_TTS_MODEL=kokoro          # speech out
HEY_REACHY_STT_MODEL=faster-whisper  # speech in
HEY_REACHY_VOICE=1                   # 0 to run mute`,

    techStack: ["Python", "openWakeWord", "faster-whisper", "Kokoro TTS", "FastAPI", "Reachy SDK"],

    journalEntries: [],
    timelineNodes: [],

    claudeContributions: [
      {
        title: "Shared voice layer",
        description:
          "Built shared/voice — wake, VAD, STT, TTS, the robot audio link, and a VoiceLoop that conducts a turn — so the app stays thin and the pieces are reusable across apps.",
        prompt:
          "Design a voice loop where the robot speaks from its own speaker and keeps the conversation going without re-waking.",
      },
      {
        title: "Pluggable brain seam",
        description:
          "One Brain interface (respond(text, history) -> Reply) with a LiteLLM brain for any OpenAI-compatible endpoint and a CommandBrain for wiring in an agent. The engine swaps without touching the app.",
      },
      {
        title: "Calm motion tuning",
        description:
          "Reduced the robot to a small, slow head-nod while speaking with antennas pinned (the self-collision risk), holding a level pose otherwise. Present without fidgeting.",
      },
    ],

    learnings: [
      "For a voice loop, latency beats raw model intelligence — a reply under a second feels alive; a smarter one that takes three feels broken.",
      "Keeping the speaker stream open across utterances was the fix for audio falling back to the laptop — closing it after each reply released the robot's audio device.",
      "Stage directions are a voice trap: the model emitting *tilts head* gets read aloud by TTS, so the persona forbids them and the app strips them before speaking.",
    ],

    lastUpdated: "2026-06-13",
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
