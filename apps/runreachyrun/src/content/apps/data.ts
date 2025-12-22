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
    slug: "reachy-companion",
    title: "Reachy Companion",
    tagline: "The ultimate Reachy control panel",
    description:
      "A comprehensive control interface for your Reachy Mini. Browse and trigger expressions, run demo sequences, configure behaviors, monitor robot status, and customize your robot's personality — all from a clean Gradio interface.",
    status: "development",
    icon: "Bot",

    githubUrl: "https://github.com/BioInfo/reachy/tree/main/docs/roadmap/companion",

    screenshots: [],

    features: [
      {
        icon: "Theater",
        title: "Expression Browser",
        description:
          "Visual gallery of all available expressions. Preview animations before triggering them on your robot.",
      },
      {
        icon: "Clapperboard",
        title: "Demo Sequences",
        description:
          "Pre-built demo routines: greetings, celebrations, reactions. Perfect for showing off your robot to visitors.",
      },
      {
        icon: "Settings",
        title: "Behavior Configuration",
        description:
          "Adjust personality parameters: how reactive, how expressive, idle behaviors. Make Reachy yours.",
      },
      {
        icon: "Activity",
        title: "Status Dashboard",
        description:
          "Real-time robot status: connection health, motor positions, temperature, battery (if applicable).",
      },
    ],

    howItWorks: [
      {
        step: 1,
        title: "Connect to Robot",
        description:
          "The app discovers your Reachy daemon automatically. Shows connection status and robot info.",
      },
      {
        step: 2,
        title: "Browse Expressions",
        description:
          "Scroll through the expression library. Each expression shows a preview animation and description.",
      },
      {
        step: 3,
        title: "Trigger & Customize",
        description:
          "Click to trigger expressions on your robot. Adjust parameters like speed and intensity.",
      },
      {
        step: 4,
        title: "Save Presets",
        description:
          "Create custom expression sequences. Save your favorite configurations for quick access.",
      },
    ],

    prerequisites: [
      "Reachy Mini Lite (physical robot or simulation)",
      "Python 3.10+",
      "Reachy daemon running on port 8000",
    ],

    quickStart: `# Coming soon!
# The app is currently in planning/development.

# For now, you can explore the roadmap:
cat docs/roadmap/companion/00-vision.md`,

    techStack: ["Python", "Gradio", "Reachy SDK", "WebSocket"],

    journalEntries: [],
    timelineNodes: [],

    claudeContributions: [
      {
        title: "Architecture Planning",
        description:
          "Designed the modular architecture allowing the companion app to work with future Reachy models and custom expressions.",
      },
    ],

    learnings: [
      "A good control panel is the difference between a demo and a daily driver",
      "Expression previews are essential — users want to see before they trigger",
    ],

    lastUpdated: "2025-12-19",
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
