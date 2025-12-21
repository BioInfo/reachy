import { TimelineNode } from "@/types";

// Timeline data — real commits linked to GitHub repo
export const timelineData: TimelineNode[] = [
  {
    id: "site-launch",
    date: "2024-12-21",
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
          "Let me give you three distinct visual directions. These aren't incremental variations — they're philosophically different approaches...",
        context: "Initial design exploration for the site",
      },
    },
    tags: ["meta", "launch", "claude-code"],
  },
  {
    id: "reachy-unboxing",
    date: "2024-12-15",
    title: "Reachy Mini Lite arrives",
    type: "milestone",
    summary:
      "Unboxed the Reachy Mini Lite. First impressions: surprisingly compact, excellent build quality, immediate desire to make it wave.",
    content: {},
    tags: ["hardware", "unboxing"],
  },
  {
    id: "first-movement",
    date: "2024-12-16",
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
    date: "2024-12-17",
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
    date: "2024-12-18",
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
    date: "2024-12-19",
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
    date: "2024-12-14",
    title: "MuJoCo simulation running",
    type: "breakthrough",
    summary:
      "Got the MuJoCo physics simulation working in headless mode. Can now develop without the physical robot connected.",
    content: {
      journal: "simulation-setup",
    },
    tags: ["software", "simulation", "mujoco"],
  },
  {
    id: "dj-reactor-start",
    date: "2024-12-20",
    title: "DJ Reactor app started",
    type: "session",
    summary:
      "Began work on DJ Reactor — Reachy responds to music with beat-synced movements and expressions.",
    content: {
      journal: "dj-reactor-start",
      commits: ["459f32a"],
    },
    tags: ["apps", "dj-reactor", "audio"],
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
