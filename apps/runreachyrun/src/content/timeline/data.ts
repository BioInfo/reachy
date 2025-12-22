import { TimelineNode } from "@/types";

// Timeline data — real commits linked to GitHub repo
export const timelineData: TimelineNode[] = [
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
