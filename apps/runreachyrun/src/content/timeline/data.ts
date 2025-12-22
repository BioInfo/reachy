import { TimelineNode } from "@/types";

// Timeline data — real commits linked to GitHub repo
export const timelineData: TimelineNode[] = [
  {
    id: "dj-reactor-beat-sync",
    date: "2025-12-22",
    title: "DJ Reactor beat synchronization fixed",
    type: "session",
    summary:
      "Robot was just shaking instead of dancing after refactor. Fixed beat_phase calculation so movements actually sync to the music. Now the head dips on beats, body sways with bass, antennas bounce with treble.",
    content: {
      claudeSnippet: {
        prompt: "The robot is just shaking randomly, not dancing to the beat",
        response:
          "The issue is the movements aren't synced to actual beats. I'm adding beat_phase (0-1 position in beat cycle) calculated from real beat detection: beat_phase = (time_since_beat / beat_interval) % 1.0. All movements will use beat_phase * 2π for sine wave phase...",
        context: "Debugging why DJ Reactor lost its groove",
      },
    },
    tags: ["apps", "dj-reactor", "audio", "debugging"],
  },
  {
    id: "rag-system-live",
    date: "2025-12-22",
    title: "Zero-cost RAG system deployed",
    type: "breakthrough",
    summary:
      "Built complete RAG system with AI chat, semantic search, and related content suggestions — all at $0/month runtime cost. Pre-computed embeddings at build time, client-side vector search, free-tier LLM.",
    content: {
      commits: ["c92e5eb"],
      claudeSnippet: {
        prompt: "How does DJ Reactor detect beats?",
        response:
          "DJ Reactor uses FFT analysis with ~50ms latency. Audio is captured in a parallel thread, analyzed for frequency bands and beat detection, then movement commands are sent to the robot synchronized to the beat_phase...",
        context: "Testing the new AI chat feature with a real question",
      },
    },
    tags: ["meta", "ai", "rag", "breakthrough", "claude-code"],
  },
  {
    id: "codebase-consolidation",
    date: "2025-12-21",
    title: "Codebase consolidation complete",
    type: "milestone",
    summary:
      "Converted both custom apps (DJ Reactor, Focus Guardian) from prototype to production ReachyMiniApp format. Removed 2,761 lines of prototype code, added 1,889 lines of consolidated packages.",
    content: {
      commits: ["a035525"],
    },
    tags: ["apps", "infrastructure", "refactoring"],
  },
  {
    id: "dj-reactor-huggingface",
    date: "2025-12-21",
    title: "DJ Reactor published to HuggingFace",
    type: "milestone",
    summary:
      "First music-reactive app published! DJ Reactor makes Reachy Mini dance with real-time audio analysis, dramatic body sway, head bob, and BPM-synced movements.",
    content: {
      claudeSnippet: {
        prompt: "Let's get DJ Reactor published to HuggingFace",
        response:
          "Converting to ReachyMiniApp format... The app needs to inherit from the base class and use the daemon-managed robot connection. I'll refactor the audio analysis to run in a separate thread...",
        context: "Publishing the second app to HuggingFace",
      },
    },
    tags: ["apps", "dj-reactor", "huggingface", "milestone"],
  },
  {
    id: "huggingface-publish",
    date: "2025-12-21",
    title: "First HuggingFace Space published",
    type: "milestone",
    summary:
      "Refactored Focus Guardian to ReachyMiniApp format and published to HuggingFace Spaces. First step toward the official app store.",
    content: {
      journal: "huggingface-publish",
      claudeSnippet: {
        prompt: "How do I get Focus Guardian into the Pollen Robotics app ecosystem?",
        response:
          "The ecosystem expects apps to inherit from ReachyMiniApp, not run standalone. Your app receives a pre-initialized robot and must respect stop_event for clean shutdown...",
        context: "Learning the dashboard plugin architecture",
      },
    },
    tags: ["apps", "huggingface", "ecosystem", "milestone"],
  },
  {
    id: "site-launch",
    date: "2025-12-21",
    title: "runreachyrun.com goes live",
    type: "milestone",
    summary:
      "Launched the documentation site for the Reachy Mini Lite build. Built with Next.js 14, Tailwind, and Claude Code.",
    content: {
      journal: "first-day",
      commits: ["8fdd83a"],
      claudeSnippet: {
        prompt:
          "I want to brainstorm the design direction. Show me 2-3 distinct visual directions we could take.",
        response:
          "Let me give you three distinct visual directions. These aren't incremental variations — they're philosophically different approaches: Transmission (signal aesthetic), Exposed Circuitry (PCB traces), Dual Presence (visible AI layer)...",
        context: "Initial design exploration for the site",
      },
    },
    tags: ["meta", "launch", "claude-code"],
  },
  {
    id: "first-physical-boot",
    date: "2025-12-20",
    title: "First physical robot boot",
    type: "breakthrough",
    summary:
      "45 minutes from 'help me get it running' to a talking robot. Claude Code debugged sim-vs-hardware mode, serial port locking, and API key storage in real-time.",
    content: {
      journal: "first-boot",
      claudeSnippet: {
        prompt: "I built my Reachy light. Can you help me get it running?",
        response:
          "Let me check USB detection first... Found /dev/cu.usbmodem5AF71342721. Now checking daemon status... It's running in --sim mode. Need to switch to hardware mode.",
        context: "Real-time hardware debugging with AI",
      },
    },
    tags: ["hardware", "debugging", "claude-code", "breakthrough"],
  },
  {
    id: "dj-reactor-complete",
    date: "2025-12-20",
    title: "DJ Reactor MVP complete",
    type: "breakthrough",
    summary:
      "Built music visualizer with 7 genre presets. Real-time beat detection, FFT analysis, and synchronized robot movements. The robot dances!",
    content: {
      journal: "dj-reactor-start",
      commits: ["459f32a"],
    },
    tags: ["apps", "dj-reactor", "audio", "breakthrough"],
  },
  {
    id: "reachy-unboxing",
    date: "2025-12-15",
    title: "Reachy Mini Lite arrives",
    type: "milestone",
    summary:
      "Unboxed the Reachy Mini Lite. First impressions: surprisingly compact, excellent build quality, immediate desire to make it wave.",
    content: {},
    tags: ["hardware", "unboxing"],
  },
  {
    id: "first-movement",
    date: "2025-12-16",
    title: "First successful movement",
    type: "breakthrough",
    summary:
      "Got Reachy to execute a coordinated head turn and antenna wiggle. Took 3 hours to figure out the coordinate system.",
    content: {
      journal: "first-movement",
      commits: ["5762b85"],
      claudeSnippet: {
        prompt: "Help me understand the coordinate system for head movements",
        response:
          "The Reachy Mini uses a coordinate system where Z is forward/backward head tilt, roll is left/right head tilt...",
      },
    },
    tags: ["software", "sdk", "breakthrough"],
  },
  {
    id: "camera-issues",
    date: "2025-12-17",
    title: "Camera integration blocked",
    type: "failure",
    summary:
      "Attempted to integrate head pose detection. Camera timeout issues in headless mode. Need to investigate SDK camera handling.",
    content: {
      journal: "camera-debugging",
    },
    tags: ["software", "camera", "blocker"],
  },
  {
    id: "focus-guardian-concept",
    date: "2025-12-18",
    title: "Focus Guardian app concept",
    type: "session",
    summary:
      "Brainstormed a productivity app: Reachy as a body double that tracks focus and provides gentle accountability.",
    content: {
      journal: "focus-guardian-prd",
      commits: ["180c09d"],
    },
    tags: ["apps", "focus-guardian", "concept"],
  },
  {
    id: "daemon-setup",
    date: "2025-12-19",
    title: "Daemon auto-start configured",
    type: "session",
    summary:
      "Set up LaunchAgent for the Reachy daemon. Now starts automatically on login and restarts if it crashes.",
    content: {
      commits: ["e4fb58d"],
    },
    tags: ["software", "infrastructure", "daemon"],
  },
  {
    id: "simulation-working",
    date: "2025-12-14",
    title: "MuJoCo simulation running",
    type: "breakthrough",
    summary:
      "Got the MuJoCo physics simulation working in headless mode. Can now develop without the physical robot connected.",
    content: {
      journal: "simulation-setup",
    },
    tags: ["software", "simulation", "mujoco"],
  },
];

// Helper to get timeline nodes sorted by date (newest first)
export function getTimelineSorted(): TimelineNode[] {
  return [...timelineData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Helper to filter timeline by type
export function getTimelineByType(
  type: TimelineNode["type"]
): TimelineNode[] {
  return timelineData.filter((node) => node.type === type);
}

// Helper to filter timeline by tag
export function getTimelineByTag(tag: string): TimelineNode[] {
  return timelineData.filter((node) => node.tags.includes(tag));
}
