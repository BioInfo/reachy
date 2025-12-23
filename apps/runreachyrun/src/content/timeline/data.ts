import { TimelineNode } from "@/types";

// Timeline data — auto-generated from devlog
// Last synced: 2025-12-23T12:38:07.105Z
// To update: npm run sync-devlog
export const timelineData: TimelineNode[] = [
  {
    id: "zero-cost-rag-system-live-20251222",
    date: "2025-12-22",
    title: "Zero-Cost RAG System Live",
    type: "milestone",
    summary:
      "Built and deployed a complete RAG (Retrieval-Augmented Generation) system for runreachyrun.com with zero runtime cost. Users can now chat with an AI about the Reachy project, search semantically across all content, and see AI-suggested related content.",
    content: {
      commits: ["c92e5eb"],
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "Most RAG systems require expensive vector databases and API calls per query. This implementation uses pre-computed embeddings at build time, client-side vector search, and a free-tier LLM. The entire system costs $0/month to run.",
        context: "Asking \"How does DJ Reactor detect beats?\" in the chat widget and getting a detailed response about FFT analysis, ~50ms latency, and parallel threads — all grounded in actual site content.",
      },
    },
    tags: ["software", "claude-code", "infrastructure", "rag", "meta"],
  },
  {
    id: "dj-reactor-beat-sync-fix-20251222",
    date: "2025-12-22",
    title: "DJ Reactor Beat-Sync Fix",
    type: "session",
    summary:
      "Robot was just shaking instead of dancing after the ReachyMiniApp refactor. Found and fixed the root cause: movement wasn't actually synced to the music.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "The difference between \"robot shaking randomly\" and \"robot dancing to music\" is entirely about synchronization. This fix makes DJ Reactor actually react to beats, not just vibrate.",
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
    summary:
      "Focus Guardian and DJ Reactor were accepted into the official Pollen Robotics Reachy Mini app store. They're now listed alongside the official apps at https://huggingface.co/spaces/pollen-robotics/Reachy_Mini#/apps",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "These are community-contributed apps appearing in the official ecosystem. Anyone with a Reachy Mini can now install them directly from the dashboard with one click. The path from idea to official distribution is now proven.",
        context: "Seeing both apps listed on the official Pollen Robotics space alongside their first-party apps. The robot apps I built with Claude Code are now installable by anyone in the world.",
      },
    },
    tags: ["hardware", "software", "audio", "focus-guardian", "dj-reactor", "huggingface"],
  },
  {
    id: "reachy-echo-mvp-complete-20251222",
    date: "2025-12-22",
    title: "Reachy Echo MVP Complete",
    type: "milestone",
    summary:
      "Built the third Reachy app from scratch in one session. Echo is the \"companion\" app from the roadmap - a robot that remembers you and grows with you. Memory-first architecture with proactive behaviors.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "This is the differentiator. Most robot apps treat the robot as a voice interface that forgets everything. Echo builds a relationship - it remembers your name, your preferences, your work patterns. Day 100 feels different than Day 1.",
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
    summary:
      "A user reported both apps failing on install via HuggingFace Discussion. @apirrone submitted a PR to fix DJ Reactor within hours. Merged it and applied the same fix to Focus Guardian.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "The open source loop is working. Less than 48 hours after getting apps into the official store, external users are finding bugs, diagnosing root causes, and submitting fixes. This is exactly what building in public enables.",
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
    summary:
      "Added Google Analytics with GDPR-compliant cookie consent and fixed chat widget rate limiting issues.",
    content: {
    },
    tags: ["rag", "meta"],
  },
  {
    id: "runreachyrun-com-bug-fixes-and-deployment-20251222",
    date: "2025-12-22",
    title: "runreachyrun.com Bug Fixes and Deployment",
    type: "milestone",
    summary:
      "Continued from previous session to fix several issues with runreachyrun.com including journal slug mismatches, apps page HuggingFace URLs, and OG image deployment.",
    content: {
      journal: "Fixed journal slug mismatch by switching `getAllJournalEntries()` to use static data only; Corrected apps data: Focus Guardian and DJ Reactor are \"live\" on HuggingFace; Added \"Live on HuggingFace\" section to apps page featuring both apps; Updated Reachy Companion status from \"coming-soon\" to \"development\"; Fixed OG image deployment:",
    },
    tags: ["software", "huggingface", "infrastructure", "meta"],
  },
  {
    id: "fixed-focus-guardian-to-work-properly-via-dashboar-20251222",
    date: "2025-12-22",
    title: "Fixed Focus Guardian to work properly via dashboard",
    type: "session",
    summary:
      "Fixed Focus Guardian to work properly via dashboard. Three issues from the ReachyMiniApp conversion: missing `super().__init__()` (caused AttributeError for settings_app), incorrect `__main__` block (just printed instead of calling `wrapped_run()`), and needed `dont_start_webserver = True` since we use Gradio. App now starts, runs Gradio on 7862, r",
    content: {
    },
    tags: ["software", "claude-code", "focus-guardian"],
  },
  {
    id: "verified-all-mvp-features-intact-session-managemen-20251222",
    date: "2025-12-22",
    title: "Verified all MVP features intact: session management, timer,",
    type: "failure",
    summary:
      "Verified all MVP features intact: session management, timer, manual attention control, breathing animation, nudge/shake animations, victory dance. Camera-based tracking still blocked by SDK camera issues but manual buttons work as workaround.",
    content: {
    },
    tags: ["software", "camera", "dj-reactor"],
  },
  {
    id: "separate-venvs-per-app-20251222",
    date: "2025-12-22",
    title: "separate venvs per app",
    type: "session",
    summary:
      "Fixed custom apps not appearing in Reachy Mini Control desktop app. Root cause: desktop app uses separate venvs per app (scanning for `{app_name}_venv` directories), not the shared `.venv`. Installing with `pip install -e .` into `.venv` only works for daemon-launched apps, not desktop app discovery.",
    content: {
    },
    tags: ["software", "infrastructure"],
  },
  {
    id: "solution-created-dedicated-venvs-for-each-app-in-t-20251222",
    date: "2025-12-22",
    title: "Solution: created dedicated venvs for each app in the deskto",
    type: "session",
    summary:
      "Solution: created dedicated venvs for each app in the desktop app's Resources folder: - `/Applications/Reachy Mini Control.app/Contents/Resources/reachy_mini_focus_guardian_venv/` - `/Applications/Reachy Mini Control.app/Contents/Resources/reachy_mini_dj_reactor_venv/`  Both apps now visible in desktop app. Key learning: the desktop app and CLI dae",
    content: {
    },
    tags: ["software", "audio", "focus-guardian", "dj-reactor"],
  },
  {
    id: "fix-20251222",
    date: "2025-12-22",
    title: "Fix:",
    type: "session",
    summary:
      "Second issue: Gradio UI not appearing (no settings icon). Root cause: used `pip install -e` (editable) which doesn't copy files to site-packages. Desktop app looks for `main.py` at `site-packages/{app_name}/main.py` to detect `custom_app_url`. With editable installs, that path doesn't exist.  Fix: Always use `pip install /path/to/app` (not `-e`) fo",
    content: {
    },
    tags: ["software", "claude-code", "meta"],
  },
  {
    id: "major-runreachyrun-20251222",
    date: "2025-12-22",
    title: "Major runreachyrun",
    type: "session",
    summary:
      "Major runreachyrun.com session. Redesigned blog post template for professional reading experience: terminal-style code blocks with copy button, reading progress bar, table of contents sidebar, timeline visualization for timestamped lists. Configured Giscus comments with GitHub Discussions (bioinfo/reachy repo). Added dark/light mode toggle with loc",
    content: {
    },
    tags: ["software", "infrastructure", "meta"],
  },
  {
    id: "fixed-camera-based-gaze-detection-in-focus-guardia-20251222",
    date: "2025-12-22",
    title: "Fixed camera-based gaze detection in Focus Guardian",
    type: "session",
    summary:
      "Fixed camera-based gaze detection in Focus Guardian. MediaPipe 0.10.31 removed the `solutions` API - code was using `mp.solutions.face_mesh.FaceMesh` which no longer exists. Installed MediaPipe 0.10.13 which still has the solutions API. Also fixed sounddevice version conflict. Camera tracking should now work with the robot.",
    content: {
    },
    tags: ["hardware", "software", "camera", "audio", "focus-guardian"],
  },
  {
    id: "zero-runtime-cost-20251222",
    date: "2025-12-22",
    title: "zero runtime cost",
    type: "session",
    summary:
      "Shipped complete RAG system for runreachyrun.com with zero runtime cost. Architecture: pre-computed Nomic embeddings (768-dim vectors for 29 documents) generated locally, client-side cosine similarity search, OpenRouter chat with Gemini 2.0 Flash free tier. Features implemented: - AI Chat Widget: Markdown rendering, expandable modal view, macOS-sty",
    content: {
    },
    tags: ["claude-code", "simulation", "rag", "meta"],
  },
  {
    id: "face-mesh-20251222",
    date: "2025-12-22",
    title: "Face Mesh",
    type: "session",
    summary:
      "Finally got Focus Guardian camera-based presence detection working after extensive debugging. The journey:  1. Face Mesh - Failed. Robot sits to user's side, MediaPipe can't detect faces in profile view 2. Face Detection - Failed. Same profile view issue, even with low confidence threshold (0.1) 3. Pose Detection - Failed. Background objects (monit",
    content: {
    },
    tags: ["hardware", "software", "claude-code", "camera", "focus-guardian"],
  },
  {
    id: "dj-reactor-still-shaking-after-reachyminiapp-refac-20251222",
    date: "2025-12-22",
    title: "DJ Reactor still shaking after ReachyMiniApp refactor",
    type: "session",
    summary:
      "DJ Reactor still shaking after ReachyMiniApp refactor. Previous \"fix\" in W51 wasn't complete. Diagnosed root cause: timing mismatch. Using `duration=0.3` for goto_target but calling it every `0.033s` - each new command interrupts the previous mid-motion, causing jerky shaking instead of smooth dancing.",
    content: {
    },
    tags: ["software", "audio", "dj-reactor"],
  },
  {
    id: "fixed-by-adding-proper-beat-tracking-added-beat-ph-20251222",
    date: "2025-12-22",
    title: "Fixed by adding proper beat tracking: - Added `beat_phase` a",
    type: "session",
    summary:
      "Fixed by adding proper beat tracking: - Added `beat_phase` and `onset_strength` to AudioFeatures - AudioAnalyzer now calculates `beat_phase = (time_since_beat / beat_interval) % 1.0` - DanceController uses `features.beat_phase * 2π` for phase instead of arbitrary time - Matched duration (0.12s) to loop rate (0.1s) so movements complete before next ",
    content: {
    },
    tags: ["audio", "dj-reactor"],
  },
  {
    id: "cranked-up-expressiveness-after-user-said-needs-mo-20251222",
    date: "2025-12-22",
    title: "Cranked up expressiveness after user said \"needs more sway\":",
    type: "session",
    summary:
      "Cranked up expressiveness after user said \"needs more sway\": - Base energy 80% minimum (was 60%) - always moving big - Body sway 75° for electronic (was 55°) - Head bob × 1.2, head roll × 2.0 multipliers - Beat emphasis: -25° to -35° head dips - Antenna × 2.0 multiplier - Lower smoothing (0.2-0.25) for snappier response",
    content: {
    },
    tags: ["software", "claude-code", "audio"],
  },
  {
    id: "polished-both-huggingface-landing-pages-with-runre-20251222",
    date: "2025-12-22",
    title: "Polished both HuggingFace landing pages with runreachyrun",
    type: "session",
    summary:
      "Polished both HuggingFace landing pages with runreachyrun.com branding. Added logo, social links (X, GitHub, Bluesky), copy buttons for commands, \"View Source\" links, and links to runreachyrun.com app pages. Focus Guardian got a pomodoro timer animation (circular progress ring, pulsing dots, bouncing robot SVG).",
    content: {
    },
    tags: ["hardware", "software", "focus-guardian", "huggingface", "meta"],
  },
  {
    id: "added-google-analytics-with-gdpr-compliant-cookie--20251222",
    date: "2025-12-22",
    title: "Added Google Analytics with GDPR-compliant cookie consent to",
    type: "session",
    summary:
      "Added Google Analytics with GDPR-compliant cookie consent to runreachyrun.com: - Cookie consent banner with Accept/Decline (animated with Framer Motion) - GA4 only loads after explicit consent - IP anonymization enabled - Privacy & Cookies policy page at `/privacy` - Footer link to policy - Reset preference button on privacy page - Consent stored i",
    content: {
    },
    tags: ["meta"],
  },
  {
    id: "fixed-chat-widget-429-rate-limit-errors-20251222",
    date: "2025-12-22",
    title: "Fixed chat widget 429 rate limit errors",
    type: "session",
    summary:
      "Fixed chat widget 429 rate limit errors. Free tier of `google/gemini-2.0-flash-exp:free` on OpenRouter was hitting rate limits constantly. Switched to `google/gemini-2.0-flash-lite-001` (paid but super cheap ~$0.01/1M tokens). Chat now works reliably in production. Also improved error handling to show actual error messages instead of generic \"somet",
    content: {
    },
    tags: ["claude-code", "rag"],
  },
  {
    id: "reachy-echo-20251222",
    date: "2025-12-22",
    title: "Reachy Echo",
    type: "session",
    summary:
      "Started Reachy Echo development - the companion app from the roadmap. Named it \"Echo\" for the memory/response double meaning. Created project structure from existing vision docs in `docs/roadmap/companion/`.",
    content: {
    },
    tags: ["software", "camera", "echo"],
  },
  {
    id: "built-proactive-behavior-engine-trigger-system-tim-20251222",
    date: "2025-12-22",
    title: "Built proactive behavior engine: - Trigger system: time, dur",
    type: "session",
    summary:
      "Built proactive behavior engine: - Trigger system: time, duration, pattern, presence - 5 behaviors: morning greeting, work break reminder, build celebration, build failure support, return greeting - Cooldown management (12h for greetings, 1-2h for reminders) - Background thread checking triggers every second",
    content: {
    },
    tags: ["claude-code", "echo"],
  },
  {
    id: "echo-mvp-complete-20251222",
    date: "2025-12-22",
    title: "Echo MVP complete",
    type: "milestone",
    summary:
      "Echo MVP complete. Server running on http://localhost:7861. Memory persists across sessions. Proactive engine runs in background. All integrated with Reachy robot animations (antenna movements on response, celebration dances).",
    content: {
    },
    tags: ["hardware", "dj-reactor", "echo"],
  },
  {
    id: "runreachyrun-com-launched-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Launched",
    type: "milestone",
    summary:
      "Started the public documentation site for the entire Reachy Mini build journey. Brainstormed design directions with Claude Code, settled on \"Transmission\" aesthetic, built out Next.js project with full design system in one session.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "This is the build-in-public infrastructure. Every session, breakthrough, and failure gets captured here. The site itself is meta-content — Claude Code is building the site that documents Claude Code building the robot.",
        context: "Seeing the landing page render with animated signal lines, the cyan glow on hover, the \"Recent Transmissions\" grid pulling from placeholder data that will soon be real milestones.",
      },
    },
    tags: ["hardware", "software", "claude-code", "infrastructure", "meta"],
  },
  {
    id: "first-huggingface-space-published-20251221",
    date: "2025-12-21",
    title: "First HuggingFace Space Published",
    type: "breakthrough",
    summary:
      "Refactored Focus Guardian from standalone Gradio app to proper `ReachyMiniApp` format and published to HuggingFace Spaces.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "This is the path to getting apps listed in the official Reachy Mini app store. The refactor required understanding a different paradigm: dashboard-managed apps vs standalone apps.",
        context: "Running `api.upload_folder()` and seeing \"Done! Space available at: https://huggingface.co/spaces/RyeCatcher/focus-guardian\"",
      },
    },
    tags: ["software", "focus-guardian", "huggingface"],
  },
  {
    id: "dj-reactor-published-to-huggingface-20251221",
    date: "2025-12-21",
    title: "DJ Reactor Published to HuggingFace",
    type: "milestone",
    summary:
      "First music-reactive app published! DJ Reactor makes Reachy Mini dance to music with: - Real-time audio analysis (bass/mid/treble/beat detection) - Dramatic body sway (45°), head bob, antenna bounce - BPM-synced groove cycle  Published as proper ReachyMiniApp that appears in Reachy Mini dashboard.",
    content: {
    },
    tags: ["software", "audio", "dj-reactor", "huggingface"],
  },
  {
    id: "codebase-consolidation-complete-20251221",
    date: "2025-12-21",
    title: "Codebase Consolidation Complete",
    type: "milestone",
    summary:
      "Both custom apps (DJ Reactor, Focus Guardian) converted from prototype to production ReachyMiniApp format in one session.  **What changed:** - Removed 2,761 lines of prototype code across 9 files - Added 1,889 lines of consolidated, self-contained packages - Both apps now dashboard plugins with prop",
    content: {
      commits: ["a035525"],
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "Clean architecture. Each app is a single `main.py` with everything inline - audio analysis, session management, robot animations. Install with `pip install -e .`, restart daemon, app appears in dashboard. Ready for HuggingFace distribution.",
      },
    },
    tags: ["hardware", "software", "claude-code", "audio", "focus-guardian", "dj-reactor"],
  },
  {
    id: "runreachyrun-com-deployed-live-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Deployed Live",
    type: "milestone",
    summary:
      "Deployed the documentation site to Vercel with full content pipeline. The site now reads directly from devlog files, creating a seamless flow from development notes to public content.",
    content: {
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "The build-in-public infrastructure is now live. Every stream note, milestone, journal entry, and blog idea captured in the devlog automatically appears on the site. The recursive loop is complete — Claude Code builds the robot, writes the devlog, and the devlog becomes the website.",
        context: "Watching `runreachyrun.vercel.app` load for the first time with real timeline entries, journal posts, and GitHub activity. Then adding the DJ Reactor HuggingFace Space embed and seeing the actual robo",
      },
    },
    tags: ["hardware", "software", "claude-code", "infrastructure", "meta"],
  },
  {
    id: "codebase-consolidation-20251221",
    date: "2025-12-21",
    title: "Codebase Consolidation",
    type: "session",
    summary:
      "Converted both DJ Reactor and Focus Guardian from prototype structure to production ReachyMiniApp format. Removed all legacy files, consolidated code into self-contained packages.",
    content: {
      journal: "Identified DJ Reactor had dual structure (prototype + official package); Removed DJ Reactor prototype files (app.py, audio_analyzer.py, config.py, music_animations.py); Updated DJ Reactor CLAUDE.md to reflect new structure; Converted Focus Guardian to ReachyMiniApp format; Created reachy_mini_focus_guardian package with consolidated main.py; Removed Focus Guardian prototype files (5 files, 1,209 lines); Updated Focus Guardian CLAUDE.md; Installed both packages and verified entry point registration; Committed all changes (19 files, -2,761/+1,889 lines)",
    },
    tags: ["software", "claude-code", "audio", "focus-guardian", "dj-reactor"],
  },
  {
    id: "dj-reactor-reachyminiapp-debugging-20251221",
    date: "2025-12-21",
    title: "DJ Reactor ReachyMiniApp Debugging",
    type: "session",
    summary:
      "Debugged and fixed DJ Reactor app to work properly with the ReachyMiniApp format. The app was starting but immediately exiting due to multiple initialization issues. Also restored the rich UI that was lost during the earlier refactor.",
    content: {
      journal: "Fixed `super().__init__()` missing in DJReactorApp class; Fixed port conflict by setting `dont_start_webserver = True`; Fixed camera timeout by setting `request_media_backend = \"no_media\"`; Restored genre selector with 7 presets (Rock, Electronic, Jazz, Pop, Classical, Hip-Hop, Chill); Added Beat Sensitivity slider; Added colored progress bars for Bass/Mid/Treble/Energy visualization; Updated CLAUDE.md to enforce real robot mode (no --sim flag); App now appears and works in Reachy Mini desktop app",
    },
    tags: ["software", "audio", "dj-reactor"],
  },
  {
    id: "dj-reactor-development-hf-publishing-20251221",
    date: "2025-12-21",
    title: "DJ Reactor Development & HF Publishing",
    type: "milestone",
    summary:
      "Got DJ Reactor running on real Reachy Mini robot with dramatic dance movements, refactored to ReachyMiniApp format, and published to HuggingFace Spaces. Also added animated robot header to Focus Guardian HF page.",
    content: {
      journal: "Fixed daemon to connect to real robot (was running in --sim mode); Tuned audio analysis for BlackHole loopback audio levels; Implemented dramatic dance movements (45° body sway, head bob, antenna bounce); Removed over-smoothing that was causing \"shaking\" instead of dancing; Refactored to ReachyMiniApp format with proper entry point; Created HF Space landing page with animated robot + music waves; Published to https://huggingface.co/spaces/RyeCatcher/dj-reactor; Added animated robot guardian header to Focus Guardian HF page; Matched design language between both app pages",
    },
    tags: ["hardware", "software", "audio", "focus-guardian", "dj-reactor", "huggingface"],
  },
  {
    id: "focus-guardian-finalization-20251221",
    date: "2025-12-21",
    title: "Focus Guardian Finalization",
    type: "session",
    summary:
      "Started finalizing Focus Guardian for use with real Reachy Mini robot. Integrated camera-based attention monitoring into the Gradio app.",
    content: {
    },
    tags: ["hardware", "software", "camera", "focus-guardian"],
  },
  {
    id: "huggingface-publishing-runreachyrun-com-updates-20251221",
    date: "2025-12-21",
    title: "HuggingFace Publishing & runreachyrun.com Updates",
    type: "milestone",
    summary:
      "Refactored Focus Guardian to the ReachyMiniApp pattern, published to HuggingFace Spaces, fixed runtime errors, redesigned the landing page, and continued runreachyrun.com development (emoji-to-Lucide migration).",
    content: {
      journal: "Refactored Focus Guardian from standalone Gradio app to `ReachyMiniApp` pattern; Created proper package structure (`pyproject.toml`, `__init__.py`, etc.); Published to https://huggingface.co/spaces/RyeCatcher/focus-guardian; Fixed runtime error: changed `sdk: gradio` to `sdk: static`; Redesigned landing page with 6 feature cards, SVG icons, workflow diagram; Completed emoji-to-Lucide icon migration across all components; Updated blog page, claude page, apps showcase, homepage; Extended Icon component with additional icons (Shield, RefreshCcw, Ruler, etc.); Build verified passing; Created `docs/publishing-reachy-apps.md` — complete guide for HF publishing; Documented standard HF Space layout pattern for future apps; Updated devlog (stream, journal, milestones)",
    },
    tags: ["software", "focus-guardian", "huggingface", "meta"],
  },
  {
    id: "runreachyrun-com-deployment-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Deployment",
    type: "milestone",
    summary:
      "Deployed runreachyrun.com to production. Completed the content pipeline connecting devlog files to the live site, added mobile responsiveness, RSS feed, and HuggingFace Space embedding.",
    content: {
    },
    tags: ["huggingface", "infrastructure", "rag", "meta"],
  },
  {
    id: "runreachyrun-com-development-20251221",
    date: "2025-12-21",
    title: "runreachyrun.com Development",
    type: "session",
    summary:
      "Built out core pages and features for runreachyrun.com documentation site. Completed Timeline, Journal, and GitHub integration. Two Phase 1 items remaining.",
    content: {
      journal: "**Timeline page** — Vertical timeline with expandable nodes, type/tag filtering, Claude Code snippet display, media grid, commit links; **Journal section** — Index page with mood/tag filters, 6 placeholder entries with full content, individual entry pages with markdown rendering, prev/next navigation; **GitHub integration** — API utility library, cached API route, live activity dashboard with fallback data",
    },
    tags: ["claude-code", "meta"],
  },
  {
    id: "first-physical-robot-boot-with-claude-code-20251220",
    date: "2025-12-20",
    title: "First Physical Robot Boot (with Claude Code)",
    type: "breakthrough",
    summary:
      "Built Reachy Mini Lite overnight, connected via USB. Asked Claude Code for help getting it running. 45 minutes later: working robot with conversation app.",
    content: {
      journal: "`journal/2025-W51.md`",
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "This wasn't just \"robot works\" - it was a demonstration of AI-assisted hardware debugging. Claude diagnosed the sim-vs-hardware daemon issue, fixed serial port locking, tested the antenna movement, traced API key validation through source code, and set up secure credential storage. All while I watch",
        context: "Two moments actually. First: antennas wiggling on CLI command. Second: the robot talking back through the conversation app.",
      },
    },
    tags: ["hardware", "software", "claude-code", "simulation", "infrastructure", "rag"],
  },
  {
    id: "dj-reactor-robot-dances-to-music-20251220",
    date: "2025-12-20",
    title: "DJ Reactor - Robot Dances to Music",
    type: "session",
    summary:
      "Built second app from the roadmap. Real-time audio analysis (beat detection, FFT) drives robot movements. 7 genre presets with distinct movement personalities.",
    content: {
      journal: "`journal/2025-W51.md`",
      claudeSnippet: {
        prompt: "What makes this significant?",
        response:
          "This proves the robot can do more than chat. It can react to its environment in real-time. The same audio analysis could power meeting reactions, emotion mirroring, or ambient awareness.",
        context: "Watching the robot's head bob to the beat, antennas flicking on high frequencies. It actually looks like it's enjoying the music.",
      },
    },
    tags: ["hardware", "software", "audio", "dj-reactor", "rag"],
  },
  {
    id: "dj-reactor-development-20251220",
    date: "2025-12-20",
    title: "DJ Reactor Development",
    type: "session",
    summary:
      "Built DJ Reactor, a music visualizer app for Reachy Mini that analyzes audio in real-time and moves the robot expressively to the beat with genre-specific movement styles.",
    content: {
      journal: "Fixed `shared/reachy_utils/robot.py` to use `media_backend='default_no_video'` instead of deprecated `camera=False` - avoids 30-second camera timeout; Created `PRD.md` with full product requirements; Created `CLAUDE.md` with app-specific AI context; Created `requirements.txt` with dependencies",
    },
    tags: ["hardware", "software", "audio", "dj-reactor"],
  },
  {
    id: "first-physical-robot-boot-devlog-setup-20251220",
    date: "2025-12-20",
    title: "First Physical Robot Boot & Devlog Setup",
    type: "breakthrough",
    summary:
      "First boot of the physical Reachy Mini Lite after overnight assembly. Transitioned from simulation to hardware mode with Claude Code assistance. Set up devlog system for \"building in public\" documentation. Got conversation app working with OpenAI integration.",
    content: {
      journal: "Connected Reachy Mini Lite via USB; Detected at `/dev/cu.usbmodem5AF71342721`; Diagnosed sim-vs-hardware daemon issue; Fixed serial port locking (\"device busy\" error); Successfully initialized all 9 motors; Ran first antenna movement test from CLI; Created `devlog/` directory structure for \"building in public\" content; `stream.md` - Running commentary (append-only); `ideas.md` - Ideas and brainstorms; `milestones.md` - Key moments for blog posts; `posts/` - Polished blog-ready content; Updated `CLAUDE.md` with devlog instructions and triggers; Removed `sessions/` directory from git history using `git filter-repo`; Force pushed cleaned history to GitHub; Added `sessions/` and `devlog/` to `.gitignore`; These directories now stay local (personal content); Diagnosed API key validation failure; Tested OpenAI key directly (HTTP 200 - valid); Discovered sim vs hardware have separate app installs; Reinstalled conversation app from dashboard app store; Set up secure API key storage:; Created comprehensive blog post: `devlog/posts/2025-12-20-first-boot-with-claude-code.md`; Documents the Claude Code + robot interaction story; Includes CLI commands, troubleshooting steps, lessons learned",
    },
    tags: ["hardware", "software", "claude-code", "simulation", "infrastructure", "meta"],
  },
  {
    id: "runreachyrun-com-initial-setup-20241221",
    date: "2024-12-21",
    title: "runreachyrun.com Initial Setup",
    type: "session",
    summary:
      "Set up the runreachyrun.com documentation site for the Reachy Mini Lite build journey. Brainstormed design directions, landed on \"Transmission\" aesthetic, initialized Next.js project with full design system.",
    content: {
      journal: "Initialized Next.js 14+ with TypeScript, Tailwind, Framer Motion; Created custom \"Transmission\" design system:; Built UI primitives: SignalBadge, SignalLine, Card; Created Nav and Footer layout components; Built landing page with hero, recent transmissions, and meta sections; Set up TypeScript types for all content structures; Created placeholder timeline data (8 nodes); Build verified passing",
    },
    tags: ["claude-code", "infrastructure", "meta"],
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
