import { JournalEntry } from "@/types";

// Auto-generated from devlog/journal — Last synced: 2025-12-23T18:18:42.187Z
// Run: npm run sync-devlog
export const journalEntries: JournalEntry[] = [
  {
    slug: "publishing-to-huggingface-ecosystem",
    title: "Publishing to HuggingFace Ecosystem",
    date: "2025-12-21",
    summary: "**Duration:** ~1 hour **Goal:** Get Focus Guardian into the Pollen Robotics app ecosystem",
    content: `**Duration:** ~1 hour
**Goal:** Get Focus Guardian into the Pollen Robotics app ecosystem

### The Discovery

Asked Claude about getting Focus Guardian compatible with the Pollen Robotics app store (https://huggingface.co/spaces/pollen-robotics/Reachy_Mini). Turns out our standalone Gradio app architecture is fundamentally different from what the ecosystem expects.

### Two Different Paradigms

**What we built (Standalone):**
\`\`\`python
# Our Focus Guardian
def main():
    robot = get_robot()  # We manage connection
    demo = create_gradio_app()
    demo.launch()  # We control lifecycle
\`\`\`

**What Pollen expects (Dashboard Plugin):**
\`\`\`python
# ReachyMiniApp pattern
class FocusGuardian(ReachyMiniApp):
    def run(self, reachy_mini, stop_event):
        # Robot already connected by daemon
        # Dashboard controls start/stop
        while not stop_event.is_set():
            # Do stuff with reachy_mini
\`\`\`

The key insight: apps in the Reachy Mini ecosystem are **plugins**, not standalone applications. The daemon manages robot connections. The dashboard manages app lifecycle. Your app just receives a connected robot and a stop signal.

### The Refactor

Created new package structure in \`apps/focus-guardian-hf/\`:

\`\`\`
focus-guardian-hf/
├── pyproject.toml           # Package config
├── README.md                # HuggingFace Space metadata
├── index.html               # Landing page
├── style.css                # Landing page styles
└── reachy_mini_focus_guardian/
    ├── __init__.py
    └── main.py              # FocusGuardian(ReachyMiniApp)
\`\`\`

Key changes in \`main.py\`:
1. Inherit from \`ReachyMiniApp\`
2. Implement \`run(reachy_mini, stop_event)\` instead of \`main()\`
3. Use the pre-initialized robot - don't call \`get_robot()\`
4. Check \`stop_event.is_set()\` in main loop for clean shutdown
5. Set \`custom_app_url\` to point to Gradio UI running in separate thread

### Publishing Process

\`\`\`python
from huggingface_hub import login, HfApi, create_repo, upload_folder

login(token="hf_xxx")
api = HfApi()

create_repo("RyeCatcher/focus-guardian", repo_type="space", space_sdk="gradio")
api.upload_folder(folder_path="./focus-guardian-hf", repo_id="RyeCatcher/focus-guardian", repo_type="space")
\`\`\`

Result: https://huggingface.co/spaces/RyeCatcher/focus-guardian

### Not Submitted to Official Store Yet

To get listed in the official app store, need to run:
\`\`\`bash
reachy-mini-app-assistant publish --official
\`\`\`

This creates a PR to \`pollen-robotics/reachy-mini-official-app-store\` dataset. Holding off until the app is more polished.

### Documentation Created

Wrote \`docs/publishing-reachy-apps.md\` covering:
- ReachyMiniApp pattern
- Package structure
- Publishing methods (Python API, Git, official assistant)
- Common issues and solutions

### Lessons Learned

1. **Ecosystem integration requires architectural changes.** Can't just push a standalone app and expect it to work.

2. **The dashboard is the control plane.** Apps are plugins that respond to start/stop signals. Robot connection is shared infrastructure.

3. **custom_app_url bridges the gap.** If your app has a web UI (Gradio, etc.), run it in a thread and point \`custom_app_url\` to it.

4. **huggingface_hub Python API > CLI.** The CLI's interactive login doesn't work in non-TTY contexts. Python API with explicit token is more reliable.

5. **The refactor is valuable regardless of ecosystem.** Clean separation of concerns: robot control loop vs UI vs business logic.

### Post-Publish Fixes

**Problem 1: Runtime Error**
\`\`\`
ModuleNotFoundError: No module named 'reachy_mini'
\`\`\`

The Space tried to run the Python code on HuggingFace's servers. But \`reachy-mini\` SDK only works locally where the robot is connected.

**Fix:** Changed \`sdk: gradio\` to \`sdk: static\` in README frontmatter. The Space now serves static HTML instead of trying to execute Python.

**Problem 2: Broken Links & Emojis**

Footer had links to pages that don't exist yet. Also used emojis which we're avoiding.

**Fix:** Redesigned entire landing page:
- 6 feature cards with inline SVG icons (Lucide icons converted to SVG)
- Numbered install steps
- "How It Works" workflow diagram
- Valid footer links: runreachyrun.com | HuggingFace | @bioinfo | Reachy Mini
- Design matches runreachyrun.com (dark theme, cyan/amber accents, JetBrains Mono)

**Key Insight:** HuggingFace Spaces for Reachy Mini apps are *distribution points*, not running apps:
1. Landing page for discovery
2. \`pip install git+https://huggingface.co/spaces/...\` for installation
3. Actual execution happens locally

Documented standard layout in \`docs/publishing-reachy-apps.md\`. Reference implementation at \`apps/focus-guardian-hf/\`.

---`,
    tags: ["hardware", "software", "claude-code", "focus-guardian", "huggingface", "infrastructure"],
    mood: "neutral",
    readingTime: 3,
    linkedTimeline: [],
  },
  {
    slug: "runreachyrun-com-initial-setup",
    title: "runreachyrun.com Initial Setup",
    date: "2025-12-21",
    summary: "**Duration:** ~45 minutes **Goal:** Set up the public documentation site for the Reachy build journey",
    content: `**Duration:** ~45 minutes
**Goal:** Set up the public documentation site for the Reachy build journey

### Context

We need a place to share the Reachy Mini journey publicly. Not just a blog — a living documentation of every session, milestone, failure, and app. Something that captures the build-in-public spirit while being genuinely useful for others building with Reachy or working with Claude Code.

### Design Exploration

Brainstormed three distinct visual directions:

**1. Transmission**
Signal/waveform aesthetic. Dark with electric cyan. Data being decoded. Timeline as waveform with amplitude = significance. The robot is sending transmissions as it comes to life.

**2. Exposed Circuitry**
PCB traces, current flowing. Follow connections between ideas. Each node shows its wiring diagram. Technical, connected, systematic.

**3. Dual Presence**
Two visible authors (human/AI). Warm colors for human decisions, cool for Claude suggestions. Revelation slider to see process behind any section.

**Decision:** Transmission, content-first variant.

Why: The robot journey should be primary. The AI collaboration angle is interesting but risks overwhelming the actual content. People come to see the robot build, not to study human-AI workflows. Claude's involvement gets documented — there's a /claude section, occasional annotations — but it's not the architecture.

### Implementation

Built in one session:

**Design System:**
- Background: \`#0d0d0f\` (deep charcoal with noise texture)
- Primary accent: \`#00ffd5\` (electric cyan — active, current)
- Secondary: \`#ffaa00\` (warm amber — highlights, CTAs)
- Success: \`#4ade80\` (milestones achieved)
- Failure: \`#ff6b6b\` (honest documentation of what didn't work)

**Typography:**
- JetBrains Mono for code, headings, data
- Inter for body text
- CSS custom properties for all tokens

**Components:**
- \`SignalBadge\` — Status badges with optional pulse animation
- \`SignalLine\` — Animated horizontal dividers
- \`Card\` — Interactive cards with cyan glow on hover
- \`Nav\` — Sticky header with animated underline
- \`Footer\` — Links and attribution

**Landing Page:**
- Hero with animated signal lines background
- Recent Transmissions grid (4 cards from timeline)
- "What is this?" feature overview
- Meta section about Claude Code (appropriately subtle)

**Content Structure:**
\`\`\`typescript
interface TimelineNode {
  id: string;
  date: string;
  title: string;
  type: 'milestone' | 'session' | 'breakthrough' | 'failure' | 'blog';
  summary: string;
  content?: { journal, commits, blogPost, media, claudeSnippet };
  tags: string[];
}
\`\`\`

8 placeholder nodes matching real milestones from the past week.

### Files Created

\`\`\`
apps/runreachyrun/
├── src/
│   ├── app/
│   │   ├── globals.css      # Full design system (~280 lines)
│   │   ├── layout.tsx       # Fonts, metadata
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── layout/          # Nav, Footer
│   │   └── ui/              # SignalBadge, SignalLine, Card
│   ├── content/timeline/data.ts
│   └── types/index.ts
└── docs/project-spec.md
\`\`\`

### The Recursion

This commit (\`8fdd83a\`) is itself content for the site's timeline. The site documents the robot build. The robot apps are documented. The site that documents them is also documented. Claude Code is building all of it.

This is what "build in public" actually looks like when AI is involved.

### Next Session

1. Build \`/timeline\` page — the centerpiece feature
2. Visual review of landing page
3. Replace placeholder content with real data
4. Consider waveform visualization for timeline

---

*The infrastructure is in place. Now we fill it with the journey.*`,
    tags: ["hardware", "software", "claude-code", "camera", "infrastructure", "meta"],
    mood: "win",
    readingTime: 3,
    linkedTimeline: [],
  },
  {
    slug: "first-boot-with-claude-code",
    title: "First Boot with Claude Code",
    date: "2025-12-20",
    summary: "**Duration:** ~45 minutes from \"help me get it running\" to talking robot",
    content: `**Duration:** ~45 minutes from "help me get it running" to talking robot

### The Setup

Built my Reachy Mini Lite overnight. Woke up, plugged it in via USB, and asked Claude Code for help getting it running. What followed was a real-time debugging session that showcases how AI-assisted development actually works.

---

## The Problem: Stuck in Simulation Mode

I had been running the Reachy Mini simulator the day before, building code and testing movements. When I connected the physical robot, the daemon was still configured for simulation mode (\`--sim\` flag). The robot was physically connected but the software wasn't talking to it.

**What I said:** "I built my Reachy light. Can you help me get it running?"

**What Claude did:**

1. **Immediately checked USB detection:**
\`\`\`bash
ls /dev/tty.usb* /dev/cu.usb*
\`\`\`
Result: \`/dev/cu.usbmodem5AF71342721\` - the robot was detected!

2. **Checked daemon status:**
\`\`\`bash
ps aux | grep "reachy_mini.daemon"
\`\`\`
Found the daemon running with \`--sim --headless\` flags - simulation mode.

3. **Diagnosed the issue:** The daemon was running in sim mode, not hardware mode.

---

## The Fix: Switching from Sim to Hardware

Claude stopped the simulation daemon and started one for the physical robot:

\`\`\`bash
# Stop the sim daemon
pkill -f "reachy_mini.daemon"

# Start daemon for physical hardware (no --sim flag)
/Users/bioinfo/apps/reachy/venv/bin/python -m reachy_mini.daemon.app.main \\
  --headless --fastapi-port 8000 > /tmp/reachy-daemon.log 2>&1 &
\`\`\`

**First hiccup:** "Device or resource busy" error. The serial port was still locked from the previous daemon.

**The fix:** Kill all processes, wait for port to release, try again.

\`\`\`bash
pkill -9 -f "reachy"
sleep 2
# Port is free, start daemon again
\`\`\`

**Result:** Daemon started successfully, found the robot on \`/dev/cu.usbmodem5AF71342721\`, initialized all 9 motors.

---

## First Movement: Proof of Life

Claude ran a test script to wiggle the antennas:

\`\`\`python
from reachy_mini import ReachyMini

with ReachyMini(media_backend='no_media') as mini:
    # Wiggle the antennas
    mini.goto_target(antennas=[0.6, -0.6], duration=0.5)
    time.sleep(0.6)
    mini.goto_target(antennas=[-0.6, 0.6], duration=0.5)
    time.sleep(0.6)
    mini.goto_target(antennas=[0.0, 0.0], duration=0.5)
\`\`\`

**The moment:** Watching those antennas wiggle for the first time. Months of anticipation, reduced to a half-second of servo movement. It worked.

---

## CLI Control: Beyond the Desktop App

This is where it gets interesting for developers. You don't need the Reachy Mini Control desktop app to control the robot. Claude demonstrated full CLI control:

### Daemon Management
\`\`\`bash
# Health check
curl -s -X POST http://127.0.0.1:8000/health-check
# Returns: {"status":"ok"}

# View logs
tail -f /tmp/reachy-daemon.log

# Stop daemon
pkill -f "reachy_mini.daemon"

# Start for hardware
/Users/bioinfo/apps/reachy/venv/bin/python -m reachy_mini.daemon.app.main \\
  --headless --fastapi-port 8000

# Start for simulation
/Users/bioinfo/apps/reachy/venv/bin/python -m reachy_mini.daemon.app.main \\
  --sim --headless --fastapi-port 8000
\`\`\`

### Python SDK Control
\`\`\`python
from reachy_mini import ReachyMini
from reachy_mini.utils import create_head_pose

with ReachyMini(media_backend='no_media') as mini:
    # Move head
    mini.goto_target(
        head=create_head_pose(z=20, roll=10, mm=True, degrees=True),
        duration=1.0
    )
    # Move antennas
    mini.goto_target(antennas=[0.6, -0.6], duration=0.3)
\`\`\`

### Key CLI Options
| Option | Description |
|--------|-------------|
| \`--sim\` | Simulation mode (MuJoCo) |
| \`--headless\` | No 3D visualization window |
| \`--fastapi-port N\` | Change API port (default 8000) |
| \`--deactivate-audio\` | Skip audio initialization |

---

## Getting the Conversation App Working

Next challenge: the conversation app (Talk with Reachy Mini) wouldn't accept my OpenAI API key.

**The error:** "Failed to validate/save key. Please try again."

**What Claude investigated:**

1. **Found the validation code** in the installed package:
\`\`\`bash
grep -r "Failed to validate" ~/apps/reachy/venv/lib/python3.12/site-packages/reachy_mini_conversation_app/
\`\`\`

2. **Tested the API key directly:**
\`\`\`bash
curl -s https://api.openai.com/v1/models \\
  -H "Authorization: Bearer sk-proj-..." | tail -5
# HTTP 200 - key is valid!
\`\`\`

3. **Identified the real issue:** Apps installed for simulation mode don't carry over to hardware mode. The conversation app needed to be reinstalled.

**The fix:** Reinstall apps from the dashboard app store at http://localhost:8000

---

## Secure API Key Storage

Claude set up the OpenAI API key properly:

### macOS Keychain (secure storage)
\`\`\`bash
security add-generic-password -a "\$USER" -s "openai-api-key" -w "sk-proj-..." -U
\`\`\`

### Environment for GUI apps
\`\`\`bash
# Add to ~/.zshrc for terminal
export OPENAI_API_KEY="sk-proj-..."

# Set for GUI apps via launchctl
launchctl setenv OPENAI_API_KEY "sk-proj-..."
\`\`\`

### Retrieve from Keychain when needed
\`\`\`bash
security find-generic-password -s "openai-api-key" -w
\`\`\`

---

## The Claude Code Advantage

What made this session different from normal debugging:

1. **Parallel investigation:** Claude checked USB detection, daemon status, and searched for docs simultaneously.

2. **Web search integration:** When local docs weren't enough, Claude searched for current Reachy Mini setup guides.

3. **Code reading:** Claude read the actual conversation app source code to understand the API key validation flow.

4. **Security awareness:** Automatically stored the API key in Keychain rather than leaving it in plain text.

5. **Documentation:** Created this devlog entry while working, capturing the process in real-time.

### Commands Claude Used

| Tool | Purpose |
|------|---------|
| \`ls /dev/cu.usb*\` | Check USB device detection |
| \`ps aux \\| grep reachy\` | Find running processes |
| \`curl\` | Test API endpoints |
| \`grep -r\` | Search source code |
| \`security\` | macOS Keychain management |
| \`launchctl\` | Set environment for GUI apps |

---

## Hardware Details Discovered

From the daemon logs during startup:

\`\`\`
Found Reachy Mini serial port: /dev/cu.usbmodem5AF71342721
Voltage is stable at ~5V: [75, 75, 76, 75, 75, 75, 75, 75, 75]
Setting PID gains for motor 'body_rotation' (ID: 10): P=200, I=0, D=0
Setting PID gains for motor 'stewart_1' (ID: 11): P=300, I=0, D=0
... (6 stewart platform motors for head)
Setting PID gains for motor 'right_antenna' (ID: 17): P=200, I=0, D=0
Setting PID gains for motor 'left_antenna' (ID: 18): P=200, I=0, D=0
\`\`\`

**9 motors total:**
- 1 body rotation
- 6 stewart platform (head movement)
- 2 antennas

---

## Lessons Learned

1. **Sim and hardware are separate contexts.** Apps installed in sim mode don't carry over. The daemon needs different flags.

2. **Serial port locking is real.** When switching between sim and hardware, make sure to fully kill previous processes.

3. **CLI gives you more control.** The desktop app is nice, but real debugging happens at the command line.

4. **API key validation can fail for reasons unrelated to the key.** The key was valid; the app just wasn't installed.

5. **Claude Code as pair programmer.** Having an AI that can read source code, search the web, and execute commands in real-time dramatically accelerates debugging.

---

## What's Next

The robot talks. The antennas wiggle. Now it's time to build something interesting with it.

---

*This debugging session took ~45 minutes from "help me" to working robot. Most of that time was Claude investigating, testing, and fixing while I watched the terminal output scroll by.*

---`,
    tags: ["hardware", "software", "claude-code", "camera", "audio", "simulation"],
    mood: "win",
    readingTime: 6,
    linkedTimeline: [],
  },
  {
    slug: "building-dj-reactor-afternoon",
    title: "Building DJ Reactor (Afternoon)",
    date: "2025-12-20",
    summary: "**Duration:** ~2 hours **Goal:** Build the second app from the roadmap - DJ Reactor / Music Visualizer",
    content: `**Duration:** ~2 hours
**Goal:** Build the second app from the roadmap - DJ Reactor / Music Visualizer

### The Concept

From APP_IDEAS.md:
> **DJ Reactor:** Analyzes music and moves expressively to the beat. Different personalities for genres.

Why it's compelling: Transforms music listening into a shared experience. The robot isn't just a speaker - it's a physical visualization of sound with its own style.

---

### Architecture Overview

\`\`\`
Microphone → AudioAnalyzer → BeatDetector → MovementMapper → Robot
                 ↓               ↓
            FFT/Spectrum    BPM/Energy
                 ↓               ↓
              Gradio UI ←────────┘
\`\`\`

**Key Components:**

1. **AudioAnalyzer** (\`audio_analyzer.py\`)
   - Uses \`sounddevice\` for real-time audio capture
   - FFT for frequency band analysis (bass/mid/treble)
   - Onset detection for beat tracking
   - BPM estimation from beat intervals

2. **MovementMapper** (\`music_animations.py\`)
   - Maps audio features to robot movements
   - Genre-specific presets define movement style
   - Smoothing and randomization for natural motion

3. **GenrePresets** (\`config.py\`)
   - 7 distinct movement personalities
   - Configurable: amplitude, speed, style, emphasis

---

### Genre Movement Styles

| Genre | Head Bob | Body Sway | Antenna Style | Emphasis |
|-------|----------|-----------|---------------|----------|
| Rock | High (12mm) | Minimal | Dramatic flicks | Headbang |
| EDM | Medium (10mm) | High rotation | Pulsing | Nod |
| Jazz | Low (5mm) | Slow graceful | Gentle sway | Tilt |
| Pop | Medium (8mm) | Moderate | Bouncy | Nod |
| Classical | Very low (3mm) | Graceful arcs | Conductor | Tilt |
| Hip-Hop | Medium (10mm) | Rhythmic | Attitude flicks | Freeze |
| Chill | Low (4mm) | Slow peaceful | Gentle sway | Tilt |

Each preset also defines:
- Movement smoothing factor
- Randomness/variation amount
- Idle animation style

---

### Technical Decisions

**Why sounddevice over PyAudio?**
- More Pythonic API
- Easier to install on macOS
- Clean callback-based streaming

**Why not use librosa for everything?**
- librosa is designed for offline analysis
- For real-time, we use simpler onset detection
- BPM estimation still uses buffered approach (needs ~5s of audio)

**Beat Detection Algorithm:**
\`\`\`python
# Simplified logic
energy = sqrt(mean(audio_chunk^2))
avg_energy = mean(recent_energies)
onset_strength = energy / avg_energy

if onset_strength > threshold and time_since_last_beat > min_interval:
    beat_detected = True
    update_bpm_estimate()
\`\`\`

---

### Bugs Fixed

**Camera Timeout Issue:**
The SDK's \`ReachyMini()\` constructor tries to initialize camera by default, causing a 30-second timeout when camera isn't available.

**Wrong approach:** \`camera=False\` (not supported)
**Right approach:** \`media_backend='default_no_video'\`

Updated \`shared/reachy_utils/robot.py\` to use the correct parameter.

**UI Flickering:**
Initial timer at 0.1s (10 updates/sec) caused aggressive flickering in Gradio. Solution: Removed auto-refresh entirely. UI updates on user actions only. Robot moves independently via background thread.

---

### Files Created

\`\`\`
apps/dj-reactor/
├── PRD.md              # Full product requirements
├── CLAUDE.md           # AI context for this app
├── config.py           # Genre presets, settings
├── audio_analyzer.py   # Real-time audio analysis
├── music_animations.py # Movement system
├── app.py              # Gradio web interface
├── requirements.txt    # Dependencies
└── assets/sounds/      # (empty, for future)
\`\`\`

---

### Running DJ Reactor

\`\`\`bash
# Start daemon (hardware mode)
python -m reachy_mini.daemon.app.main --headless --fastapi-port 8000

# Run app
cd ~/apps/reachy/apps/dj-reactor
python app.py --port 7861

# Open http://localhost:7861
\`\`\`

1. Select audio input device (mic or loopback)
2. Choose genre
3. Adjust intensity/sensitivity
4. Click "Start Vibing"
5. Play music!

---

### What's Next

1. **Test with real music** - Tune beat detection per genre
2. **Add audio loopback** - For system audio (BlackHole on macOS)
3. **Real-time visualization** - Show audio meters while vibing
4. **Drop detection** - Trigger special animations on bass drops
5. **Automatic genre detection** - ML model for classification

---

*Two apps built now: Focus Guardian (paused on camera issue) and DJ Reactor (MVP complete). The robot has personality.*

---`,
    tags: ["hardware", "software", "claude-code", "camera", "audio", "simulation"],
    mood: "win",
    readingTime: 4,
    linkedTimeline: [],
  },
];

export function getAllSlugs(): string[] {
  return journalEntries.map((e) => e.slug);
}
export function getEntryBySlug(slug: string): JournalEntry | undefined {
  return journalEntries.find((e) => e.slug === slug);
}
export function getEntriesSorted(): JournalEntry[] {
  return [...journalEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
