import { TimelineNode } from "@/types";

// Auto-generated from devlog — Last synced: 2025-12-23T18:02:42.328Z
// Run: npm run sync-devlog
export const timelineData: TimelineNode[] = [
  {
    id: "repository-security-audit-public-release-prep-20251223",
    date: "2025-12-23",
    title: "Repository Security Audit & Public Release Prep",
    type: "session",
    summary: "Comprehensive security scan of entire GitHub repo and all 3 HuggingFace Spaces before public promotion. Found and fixed memory.db with user data, hardcoded internal IP, local filesystem paths, and CLAUDE.md files that shouldn't be public.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "Building in public means being careful about what's actually public. This audit caught real issues before they became problems - conversation history in git, internal infrastructure details, employer associations.",
      },
    },
    tags: ["software", "claude-code", "echo", "huggingface"],
  },
  {
    id: "package-naming-fix-desktop-app-integration-20251223",
    date: "2025-12-23",
    title: "Package Naming Fix - Desktop App Integration",
    type: "session",
    summary: "Apps weren't showing settings gear icon in Reachy Mini Control desktop app. Discovered fundamental mismatch: desktop app file scanner looks for `{space_name}/main.py` but packages were named `reachy_mini_*`.",
    content: {
      commits: ["866feeb"],
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "This completes the desktop app integration. All three community apps now appear with working settings buttons, making them first-class citizens in the Reachy ecosystem.",
      },
    },
    tags: ["software", "claude-code", "huggingface"],
  },
  {
    id: "huggingface-app-naming-fix-20251223",
    date: "2025-12-23",
    title: "HuggingFace App Naming Fix",
    type: "session",
    summary: "Fixed fundamental naming mismatch preventing desktop app integration. All three community apps (Focus Guardian, DJ Reactor, Echo) now fully integrated with Reachy Mini Control desktop app.",
    content: {
      journal: "Diagnosed root cause; Renamed all packages:; Created new HuggingFace spaces; Deleted old spaces; Fixed Focus Guardian motion detection; Updated website; Committed and pushed",
    },
    tags: ["software", "audio", "focus-guardian", "dj-reactor", "echo", "huggingface"],
  },
  {
    id: "unified-content-sync-for-runreachyrun-com-20251223",
    date: "2025-12-23",
    title: "Unified Content Sync for runreachyrun.com",
    type: "session",
    summary: "Built unified content sync system for runreachyrun.com that automatically generates all TypeScript data files from devlog markdown sources.",
    content: {
    },
    tags: ["meta"],
  },
  {
    id: "zero-cost-rag-system-live-20251222",
    date: "2025-12-22",
    title: "Zero-Cost RAG System Live",
    type: "milestone",
    summary: "Built and deployed a complete RAG (Retrieval-Augmented Generation) system for runreachyrun.com with zero runtime cost. Users can now chat with an AI about the Reachy project, search semantically across all content, and see AI-suggested related content.",
    content: {
      commits: ["c92e5eb"],
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "Most RAG systems require expensive vector databases and API calls per query. This implementation uses pre-computed embeddings at build time, client-side vector search, and a free-tier LLM. The entire system costs $0/month to run.",
        context: "Asking \"How does DJ Reactor detect beats?\" in the chat widget and getting a detailed response about FFT analysis, ~50ms latency, and parallel threads — all grounded in actual site content.",
      },
    },
    tags: ["claude-code", "infrastructure", "rag", "meta"],
  },
  {
    id: "dj-reactor-beat-sync-fix-20251222",
    date: "2025-12-22",
    title: "DJ Reactor Beat-Sync Fix",
    type: "session",
    summary: "Robot was just shaking instead of dancing after the ReachyMiniApp refactor. Found and fixed the root cause: movement wasn't actually synced to the music.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "The difference between \"robot shaking randomly\" and \"robot dancing to music\" is entirely about synchronization. This fix makes DJ Reactor actually react to beats, not just vibrate.",
        context: "Watching the robot actually groove to the beat instead of twitching randomly. The head dips on beats, body sways with the bass, antennas bounce with treble.",
      },
    },
    tags: ["hardware", "software", "audio", "dj-reactor"],
  },
  {
    id: "both-apps-accepted-into-official-pollen-robotics-a-20251222",
    date: "2025-12-22",
    title: "Both Apps Accepted into Official Pollen Robotics App Store",
    type: "milestone",
    summary: "Focus Guardian and DJ Reactor were accepted into the official Pollen Robotics Reachy Mini app store. They're now listed alongside the official apps at https://huggingface.co/spaces/pollen-robotics/Reachy_Mini#/apps",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "These are community-contributed apps appearing in the official ecosystem. Anyone with a Reachy Mini can now install them directly from the dashboard with one click. The path from idea to official distribution is now proven.",
        context: "Seeing both apps listed on the official Pollen Robotics space alongside their first-party apps. The robot apps I built with Claude Code are now installable by anyone in the world.",
      },
    },
    tags: ["hardware", "software", "audio", "focus-guardian", "dj-reactor", "huggingface"],
  },
  {
    id: "reachy-echo-mvp-complete-20251222",
    date: "2025-12-22",
    title: "Reachy Echo MVP Complete",
    type: "breakthrough",
    summary: "Built the third Reachy app from scratch in one session. Echo is the \"companion\" app from the roadmap - a robot that remembers you and grows with you. Memory-first architecture with proactive behaviors.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "This is the differentiator. Most robot apps treat the robot as a voice interface that forgets everything. Echo builds a relationship - it remembers your name, your preferences, your work patterns. Day 100 feels different than Day 1.",
        context: "Sending \"My name is Justin\" and watching it get stored in SQLite. Then in a new session, Echo still knew who I was.",
      },
    },
    tags: ["hardware", "software", "echo"],
  },
  {
    id: "first-community-contribution-20251222",
    date: "2025-12-22",
    title: "First Community Contribution",
    type: "breakthrough",
    summary: "A user reported both apps failing on install via HuggingFace Discussion. @apirrone submitted a PR to fix DJ Reactor within hours. Merged it and applied the same fix to Focus Guardian.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "The open source loop is working. Less than 48 hours after getting apps into the official store, external users are finding bugs, diagnosing root causes, and submitting fixes. This is exactly what building in public enables.",
        context: "Seeing the notification that someone opened a Discussion on my HuggingFace Space. Then seeing another notification with a PR. Then realizing the PR was a one-liner that perfectly fixed the issue.",
      },
    },
    tags: ["software", "claude-code", "audio", "focus-guardian", "dj-reactor", "huggingface"],
  },
  {
    id: "runreachyrun-com-analytics-chat-fix-20251222",
    date: "2025-12-22",
    title: "runreachyrun.com Analytics & Chat Fix",
    type: "session",
    summary: "Added Google Analytics with GDPR-compliant cookie consent and fixed chat widget rate limiting issues.",
    content: {
      journal: "Google Analytics with Cookie Consent; Privacy & Cookies Page; Chat Widget Rate Limit Fix",
    },
    tags: ["rag", "meta"],
  },
  {
    id: "runreachyrun-com-bug-fixes-and-deployment-20251222",
    date: "2025-12-22",
    title: "runreachyrun.com Bug Fixes and Deployment",
    type: "milestone",
    summary: "Continued from previous session to fix several issues with runreachyrun.com including journal slug mismatches, apps page HuggingFace URLs, and OG image deployment.",
    content: {
    },
    tags: ["software", "huggingface", "infrastructure", "meta"],
  },
  {
    id: "zero-runtime-cost-20251222",
    date: "2025-12-22",
    title: "zero runtime cost",
    type: "milestone",
    summary: "Shipped complete RAG system for runreachyrun.com with zero runtime cost. Architecture: pre-computed Nomic embeddings (768-dim vectors for 29 documents) generated locally, client-side cosine similarity search, OpenRouter chat with Gemini 2.0 Flash free tier. Features implemented: - AI Chat Widget: Markdown rendering, expandable modal view, macOS-sty",
    content: {
    },
    tags: ["claude-code", "simulation", "rag", "meta"],
  },
  {
    id: "runreachyrun-com-launched-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Launched",
    type: "milestone",
    summary: "Started the public documentation site for the entire Reachy Mini build journey. Brainstormed design directions with Claude Code, settled on \"Transmission\" aesthetic, built out Next.js project with full design system in one session.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "This is the build-in-public infrastructure. Every session, breakthrough, and failure gets captured here. The site itself is meta-content — Claude Code is building the site that documents Claude Code building the robot.",
        context: "Seeing the landing page render with animated signal lines, the cyan glow on hover, the \"Recent Transmissions\" grid pulling from placeholder data that will soon be real milestones.",
      },
      media: [
              {
                      "type": "image",
                      "src": "/media/reachy-full-setup.jpg",
                      "alt": "Development setup with Reachy Mini and multiple monitors",
                      "caption": "The dev setup - MacBook Pro, monitors, and Reachy Mini companion"
              }
      ],
    },
    tags: ["software", "claude-code", "infrastructure", "meta"],
  },
  {
    id: "first-huggingface-space-published-20251221",
    date: "2025-12-21",
    title: "First HuggingFace Space Published",
    type: "breakthrough",
    summary: "Refactored Focus Guardian from standalone Gradio app to proper `ReachyMiniApp` format and published to HuggingFace Spaces.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "This is the path to getting apps listed in the official Reachy Mini app store. The refactor required understanding a different paradigm: dashboard-managed apps vs standalone apps.",
        context: "Running `api.upload_folder()` and seeing \"Done! Space available at: https://huggingface.co/spaces/RyeCatcher/focus-guardian\"",
      },
    },
    tags: ["software", "focus-guardian", "huggingface"],
  },
  {
    id: "dj-reactor-published-to-huggingface-20251221",
    date: "2025-12-21",
    title: "DJ Reactor Published to HuggingFace",
    type: "breakthrough",
    summary: "First music-reactive app published! DJ Reactor makes Reachy Mini dance to music with: - Real-time audio analysis (bass/mid/treble/beat detection) - Dramatic body sway (45°), head bob, antenna bounce - BPM-synced groove cycle  Published as proper ReachyMiniApp that appears in Reachy Mini dashboard.",
    content: {
    },
    tags: ["software", "audio", "dj-reactor", "huggingface"],
  },
  {
    id: "codebase-consolidation-complete-20251221",
    date: "2025-12-21",
    title: "Codebase Consolidation Complete",
    type: "milestone",
    summary: "Both custom apps (DJ Reactor, Focus Guardian) converted from prototype to production ReachyMiniApp format in one session.  **What changed:** - Removed 2,761 lines of prototype code across 9 files - Added 1,889 lines of consolidated, self-contained packages - Both apps now dashboard plugins with prop",
    content: {
      commits: ["a035525"],
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "Clean architecture. Each app is a single `main.py` with everything inline - audio analysis, session management, robot animations. Install with `pip install -e .`, restart daemon, app appears in dashboard. Ready for HuggingFace distribution.",
      },
    },
    tags: ["software", "claude-code", "audio", "focus-guardian", "dj-reactor"],
  },
  {
    id: "runreachyrun-com-deployed-live-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Deployed Live",
    type: "milestone",
    summary: "Deployed the documentation site to Vercel with full content pipeline. The site now reads directly from devlog files, creating a seamless flow from development notes to public content.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "The build-in-public infrastructure is now live. Every stream note, milestone, journal entry, and blog idea captured in the devlog automatically appears on the site. The recursive loop is complete — Claude Code builds the robot, writes the devlog, and the devlog becomes the website.",
        context: "Watching `runreachyrun.vercel.app` load for the first time with real timeline entries, journal posts, and GitHub activity. Then adding the DJ Reactor HuggingFace Space embed and seeing the actual robo",
      },
    },
    tags: ["infrastructure", "meta"],
  },
  {
    id: "codebase-consolidation-20251221",
    date: "2025-12-21",
    title: "Codebase Consolidation",
    type: "session",
    summary: "Converted both DJ Reactor and Focus Guardian from prototype structure to production ReachyMiniApp format. Removed all legacy files, consolidated code into self-contained packages.",
    content: {
    },
    tags: ["software", "claude-code", "audio", "focus-guardian", "dj-reactor"],
  },
  {
    id: "dj-reactor-reachyminiapp-debugging-20251221",
    date: "2025-12-21",
    title: "DJ Reactor ReachyMiniApp Debugging",
    type: "session",
    summary: "Debugged and fixed DJ Reactor app to work properly with the ReachyMiniApp format. The app was starting but immediately exiting due to multiple initialization issues. Also restored the rich UI that was lost during the earlier refactor.",
    content: {
    },
    tags: ["software", "audio", "dj-reactor"],
  },
  {
    id: "dj-reactor-development-hf-publishing-20251221",
    date: "2025-12-21",
    title: "DJ Reactor Development & HF Publishing",
    type: "session",
    summary: "Got DJ Reactor running on real Reachy Mini robot with dramatic dance movements, refactored to ReachyMiniApp format, and published to HuggingFace Spaces. Also added animated robot header to Focus Guardian HF page.",
    content: {
    },
    tags: ["hardware", "software", "audio", "focus-guardian", "dj-reactor", "huggingface"],
  },
  {
    id: "focus-guardian-finalization-20251221",
    date: "2025-12-21",
    title: "Focus Guardian Finalization",
    type: "session",
    summary: "Started finalizing Focus Guardian for use with real Reachy Mini robot. Integrated camera-based attention monitoring into the Gradio app.",
    content: {
      journal: "Wired camera feed to attention monitor; Added frame annotation; Added idle breathing animation; Verified app launch with real robot; Created test_animations.py",
    },
    tags: ["hardware", "software", "camera", "focus-guardian"],
  },
  {
    id: "huggingface-publishing-runreachyrun-com-updates-20251221",
    date: "2025-12-21",
    title: "HuggingFace Publishing & runreachyrun.com Updates",
    type: "session",
    summary: "Refactored Focus Guardian to the ReachyMiniApp pattern, published to HuggingFace Spaces, fixed runtime errors, redesigned the landing page, and continued runreachyrun.com development (emoji-to-Lucide migration).",
    content: {
    },
    tags: ["software", "focus-guardian", "huggingface", "meta"],
  },
  {
    id: "runreachyrun-com-deployment-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Deployment",
    type: "milestone",
    summary: "Deployed runreachyrun.com to production. Completed the content pipeline connecting devlog files to the live site, added mobile responsiveness, RSS feed, and HuggingFace Space embedding.",
    content: {
      journal: "Content Pipeline Complete; GitHub Submission; Vercel Deployment; RSS Feed; Mobile Responsiveness; HuggingFace Integration; Custom Domain",
    },
    tags: ["huggingface", "infrastructure", "rag", "meta"],
  },
  {
    id: "runreachyrun-com-development-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Development",
    type: "milestone",
    summary: "Built out core pages and features for runreachyrun.com documentation site. Completed Timeline, Journal, and GitHub integration. Two Phase 1 items remaining.",
    content: {
    },
    tags: ["claude-code", "meta"],
  },
  {
    id: "first-physical-robot-boot-with-claude-code-20251220",
    date: "2025-12-20",
    title: "First Physical Robot Boot (with Claude Code)",
    type: "breakthrough",
    summary: "Built Reachy Mini Lite overnight, connected via USB. Asked Claude Code for help getting it running. 45 minutes later: working robot with conversation app.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "This wasn't just \"robot works\" - it was a demonstration of AI-assisted hardware debugging. Claude diagnosed the sim-vs-hardware daemon issue, fixed serial port locking, tested the antenna movement, traced API key validation through source code, and set up secure credential storage. All while I watch",
        context: "Two moments actually. First: antennas wiggling on CLI command. Second: the robot talking back through the conversation app.",
      },
      media: [
              {
                      "type": "image",
                      "src": "/media/reachy-desk-window.jpg",
                      "alt": "Reachy Mini Lite on desk after first boot",
                      "caption": "First boot - Reachy Mini Lite connected and running"
              }
      ],
    },
    tags: ["hardware", "software", "claude-code"],
  },
  {
    id: "dj-reactor-robot-dances-to-music-20251220",
    date: "2025-12-20",
    title: "DJ Reactor - Robot Dances to Music",
    type: "session",
    summary: "Built second app from the roadmap. Real-time audio analysis (beat detection, FFT) drives robot movements. 7 genre presets with distinct movement personalities.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response: "This proves the robot can do more than chat. It can react to its environment in real-time. The same audio analysis could power meeting reactions, emotion mirroring, or ambient awareness.",
        context: "Watching the robot's head bob to the beat, antennas flicking on high frequencies. It actually looks like it's enjoying the music.",
      },
      media: [
              {
                      "type": "video",
                      "src": "/media/reachy-demo.mp4",
                      "alt": "Reachy Mini dancing to music",
                      "caption": "DJ Reactor in action - head bob and antenna bounce synced to the beat"
              }
      ],
    },
    tags: ["hardware", "software", "audio", "dj-reactor"],
  },
  {
    id: "dj-reactor-development-20251220",
    date: "2025-12-20",
    title: "DJ Reactor Development",
    type: "session",
    summary: "Built DJ Reactor, a music visualizer app for Reachy Mini that analyzes audio in real-time and moves the robot expressively to the beat with genre-specific movement styles.",
    content: {
      journal: "Audio Analysis; Movement System; Genre Presets; Web UI",
    },
    tags: ["hardware", "software", "audio", "dj-reactor"],
  },
  {
    id: "first-physical-robot-boot-devlog-setup-20251220",
    date: "2025-12-20",
    title: "First Physical Robot Boot & Devlog Setup",
    type: "breakthrough",
    summary: "First boot of the physical Reachy Mini Lite after overnight assembly. Transitioned from simulation to hardware mode with Claude Code assistance. Set up devlog system for \"building in public\" documentation. Got conversation app working with OpenAI integration.",
    content: {
      media: [
              {
                      "type": "image",
                      "src": "/media/reachy-desk-side.jpg",
                      "alt": "Reachy Mini Lite from side angle",
                      "caption": "Side view showing the Dell monitor and development station"
              }
      ],
    },
    tags: ["hardware", "software", "claude-code", "simulation", "infrastructure", "meta"],
  },
  {
    id: "runreachyrun-com-initial-setup-20241221",
    date: "2024-12-21",
    title: "runreachyrun.com Initial Setup",
    type: "session",
    summary: "Set up the runreachyrun.com documentation site for the Reachy Mini Lite build journey. Brainstormed design directions, landed on \"Transmission\" aesthetic, initialized Next.js project with full design system.",
    content: {
    },
    tags: ["claude-code", "infrastructure", "meta"],
  },
];

export function getTimelineSorted(): TimelineNode[] {
  return [...timelineData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export function getTimelineByType(type: TimelineNode["type"]): TimelineNode[] {
  return timelineData.filter((node) => node.type === type);
}
export function getTimelineByTag(tag: string): TimelineNode[] {
  return timelineData.filter((node) => node.tags.includes(tag));
}
