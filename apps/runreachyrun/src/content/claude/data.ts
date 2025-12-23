// Auto-generated from sessions — Last synced: 2025-12-23T18:18:42.189Z
// Run: npm run sync-devlog

export interface ClaudeSession {
  id: string;
  date: string;
  goal: string;
  outcome: "success" | "blocked" | "in-progress";
  summary: string;
  prompts?: { prompt: string; insight: string; code?: { language: string; code: string; description: string } }[];
  codeSnippets?: { language: string; code: string; description?: string }[];
  learnings?: string[];
  linkedFeature?: string;
}

export const claudeSessions: ClaudeSession[] = [
  {
    id: "app-naming-fix",
    date: "2025-12-23",
    goal: "HuggingFace App Naming Fix",
    outcome: "success",
    summary: "Fixed fundamental naming mismatch preventing desktop app integration. All three community apps (Focus Guardian, DJ Reactor, Echo) now fully integrated with Reachy Mini Control desktop app.",
    learnings: ["Diagnosed root cause - Desktop app file scanner looks for `{app_name}/main.py` but packages were named `reachy_mini_*`", "Renamed all packages", "Created new HuggingFace spaces with underscore naming", "Deleted old spaces with hyphenated names"],
  },
  {
    id: "unified-content-sync",
    date: "2025-12-23",
    goal: "Unified Content Sync for runreachyrun.com",
    outcome: "success",
    summary: "Built unified content sync system for runreachyrun.com that automatically generates all TypeScript data files from devlog markdown sources.",
  },
  {
    id: "runreachyrun-analytics",
    date: "2025-12-22",
    goal: "runreachyrun.com Analytics & Chat Fix",
    outcome: "success",
    summary: "Added Google Analytics with GDPR-compliant cookie consent and fixed chat widget rate limiting issues.",
    learnings: ["Google Analytics with Cookie Consent", "Privacy & Cookies Page", "Chat Widget Rate Limit Fix"],
    linkedFeature: "Website",
  },
  {
    id: "runreachyrun-fixes",
    date: "2025-12-22",
    goal: "runreachyrun.com Bug Fixes and Deployment",
    outcome: "success",
    summary: "Continued from previous session to fix several issues with runreachyrun.com including journal slug mismatches, apps page HuggingFace URLs, and OG image deployment.",
    linkedFeature: "Website",
  },
  {
    id: "codebase-consolidation",
    date: "2025-12-21",
    goal: "Codebase Consolidation",
    outcome: "success",
    summary: "Converted both DJ Reactor and Focus Guardian from prototype structure to production ReachyMiniApp format. Removed all legacy files, consolidated code into self-contained packages.",
    codeSnippets: [
      { language: "toml", code: `[project.entry-points."reachy_mini_apps"]
reachy_mini_dj_reactor = "reachy_mini_dj_reactor.main:DJReactorApp"
reachy_mini_focus_guardian = "reachy_mini_focus_guardian.main:FocusGuardianApp"` }
    ],
  },
  {
    id: "dj-reactor-debugging",
    date: "2025-12-21",
    goal: "DJ Reactor ReachyMiniApp Debugging",
    outcome: "success",
    summary: "Debugged and fixed DJ Reactor app to work properly with the ReachyMiniApp format. The app was starting but immediately exiting due to multiple initialization issues. Also restored the rich UI that was lost during the earlier refactor.",
    linkedFeature: "DJ Reactor",
  },
  {
    id: "dj-reactor",
    date: "2025-12-21",
    goal: "DJ Reactor Development & HF Publishing",
    outcome: "success",
    summary: "Got DJ Reactor running on real Reachy Mini robot with dramatic dance movements, refactored to ReachyMiniApp format, and published to HuggingFace Spaces. Also added animated robot header to Focus Guardian HF page.",
    codeSnippets: [
      { language: "toml", code: `[project.entry-points."reachy_mini_apps"]
reachy_mini_dj_reactor = "reachy_mini_dj_reactor.main:DJReactorApp"` }
    ],
    linkedFeature: "DJ Reactor",
  },
  {
    id: "focus-guardian-finalization",
    date: "2025-12-21",
    goal: "Focus Guardian Finalization",
    outcome: "in-progress",
    summary: "Started finalizing Focus Guardian for use with real Reachy Mini robot. Integrated camera-based attention monitoring into the Gradio app.",
    codeSnippets: [
      { language: "bash", code: `cd ~/apps/reachy/apps/focus-guardian
source ../../venv/bin/activate

# Test animations first
python test_animations.py

# Then run the app
python app.py
# Open http://localhost:7860` }
    ],
    learnings: ["Wired camera feed to attention monitor - Connected Gradio webcam component to `AttentionMonitor.process_single_frame()` for real gaze detection", "Added frame annotation - Camera feed now shows FOCUSED/DISTRACTED status bar overlay with gaze direction", "Added idle breathing animation - Background thread runs subtle antenna breathing during focus sessions", "Verified app launch with real robot - App successfully connects to daemon (\"Robot connected"],
    linkedFeature: "Focus Guardian",
  },
  {
    id: "huggingface-publishing",
    date: "2025-12-21",
    goal: "HuggingFace Publishing & runreachyrun.com Updates",
    outcome: "success",
    summary: "Refactored Focus Guardian to the ReachyMiniApp pattern, published to HuggingFace Spaces, fixed runtime errors, redesigned the landing page, and continued runreachyrun.com development (emoji-to-Lucide migration).",
    linkedFeature: "HuggingFace Integration",
  },
  {
    id: "runreachyrun-deploy",
    date: "2025-12-21",
    goal: "runreachyrun.com Deployment",
    outcome: "success",
    summary: "Deployed runreachyrun.com to production. Completed the content pipeline connecting devlog files to the live site, added mobile responsiveness, RSS feed, and HuggingFace Space embedding.",
    codeSnippets: [
      { language: "text", code: `devlog/milestones/*.md → parseMilestoneFile() → /timeline
devlog/journal/*.md → parseJournalFile() → /journal
devlog/blog/*.md → parseBlogFile() → /blog` }
    ],
    learnings: ["Content Pipeline Complete", "GitHub Submission", "Vercel Deployment", "RSS Feed"],
    linkedFeature: "Website",
  },
  {
    id: "runreachyrun-site",
    date: "2025-12-21",
    goal: "runreachyrun.com Development",
    outcome: "in-progress",
    summary: "Built out core pages and features for runreachyrun.com documentation site. Completed Timeline, Journal, and GitHub integration. Two Phase 1 items remaining.",
    linkedFeature: "Website",
  },
  {
    id: "dj-reactor-development",
    date: "2025-12-20",
    goal: "DJ Reactor Development",
    outcome: "success",
    summary: "Built DJ Reactor, a music visualizer app for Reachy Mini that analyzes audio in real-time and moves the robot expressively to the beat with genre-specific movement styles.",
    learnings: ["Audio Analysis (`audio_analyzer.py`)", "Movement System (`music_animations.py`)", "Genre Presets (`config.py`)", "Web UI (`app.py`)"],
    linkedFeature: "DJ Reactor",
  },
  {
    id: "first-physical-boot",
    date: "2025-12-20",
    goal: "First Physical Robot Boot & Devlog Setup",
    outcome: "success",
    summary: "First boot of the physical Reachy Mini Lite after overnight assembly. Transitioned from simulation to hardware mode with Claude Code assistance. Set up devlog system for \"building in public\" documentation. Got conversation app working with OpenAI integration.",
    codeSnippets: [
      { language: "bash", code: `# Hardware mode (physical robot)
/Users/bioinfo/apps/reachy/venv/bin/python -m reachy_mini.daemon.app.main \\
  --headless --fastapi-port 8000

# Simulation mode
/Users/bioinfo/apps/reachy/venv/bin/python -m reachy_mini.daemon.app.main \\
  --sim --headless --fastapi-port 8000

# Health check
curl -s -X POST http://127.0.0.1:8000/health-check

# View logs
tail -f /tmp/reachy-daemon.log` },
      { language: "bash", code: `# Store in Keychain
security add-generic-password -a "\$USER" -s "openai-api-key" -w "sk-proj-..." -U

# Retrieve from Keychain
security find-generic-password -s "openai-api-key" -w

# Set for GUI apps
launchctl setenv OPENAI_API_KEY "sk-proj-..."` }
    ],
  },
  {
    id: "runreachyrun-setup",
    date: "2024-12-21",
    goal: "runreachyrun.com Initial Setup",
    outcome: "success",
    summary: "Set up the runreachyrun.com documentation site for the Reachy Mini Lite build journey. Brainstormed design directions, landed on \"Transmission\" aesthetic, initialized Next.js project with full design system.",
    codeSnippets: [
      { language: "text", code: `apps/runreachyrun/
├── src/
│   ├── app/
│   │   ├── globals.css      # Full design system
│   │   ├── layout.tsx       # Fonts, metadata
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── layout/nav.tsx
│   │   ├── layout/footer.tsx
│   │   └── ui/{signal-badge,signal-line,card}.tsx
│   ├── content/timeline/data.ts
│   └── types/index.ts
├── docs/project-spec.md
└── package.json` }
    ],
    linkedFeature: "Website",
  },
];

export function getClaudeSessionsSorted(): ClaudeSession[] {
  return [...claudeSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
