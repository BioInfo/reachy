import { JournalEntry } from "@/types";

export const journalEntries: JournalEntry[] = [
  {
    slug: "official-app-store",
    title: "Official App Store & First Community PR",
    date: "2025-12-22",
    summary:
      "Both apps accepted into the Pollen Robotics app store. Hours later, a community member submitted our first external PR. The open source loop is working.",
    content: `
Two milestones in one day that prove the build-in-public approach works.

## Accepted into the Official App Store

After fixing the class naming convention (\`DJReactorApp\` → \`ReachyMiniDjReactor\`), both Focus Guardian and DJ Reactor passed the \`reachy-mini-app-assistant check\` validation.

Submitted to Pollen Robotics. Within hours: accepted.

Now live at: https://huggingface.co/spaces/pollen-robotics/Reachy_Mini#/apps

Anyone with a Reachy Mini can install Focus Guardian or DJ Reactor with one click from their dashboard. The apps I built with Claude Code are now in the official ecosystem.

## First Community Contribution

Same day, a user (@apirrone) reported via HuggingFace Discussion that both apps were failing on install. Class name mismatch — I'd renamed the classes but forgot to update the \`if __name__ == "__main__"\` block.

Within hours, they submitted a PR fixing DJ Reactor.

\`\`\`python
# Before (broken)
if __name__ == "__main__":
    DJReactorApp().wrapped_run()  # Old name

# After (fixed)
if __name__ == "__main__":
    ReachyMiniDjReactor().wrapped_run()  # New name
\`\`\`

Merged it. Applied the same fix to Focus Guardian. Both apps working.

## Why This Matters

Less than 48 hours from app store acceptance to external contribution. The cycle:

1. Build apps with Claude Code
2. Document everything on runreachyrun.com
3. Publish to HuggingFace
4. Get accepted to official store
5. Community finds bugs
6. Community fixes bugs
7. Everyone benefits

This is what building in public enables. The project is real enough that people care to improve it.

## Technical Note

The validation requirements I didn't know about:
- Class must be \`ReachyMini{AppName}\` not \`{AppName}App\`
- README needs both \`reachy_mini\` AND \`reachy_mini_python_app\` tags
- Entry points must match the new class names

Now documented in \`docs/publishing-reachy-apps.md\` so future apps get it right the first time.
    `.trim(),
    tags: ["apps", "huggingface", "community", "open-source"],
    mood: "win",
    readingTime: 3,
    linkedTimeline: ["both-apps-accepted-into-official-pollen-robotics-a-20251222", "first-community-contribution-20251222"],
  },
  {
    slug: "huggingface-publish",
    title: "Publishing to HuggingFace: A Different Paradigm",
    date: "2025-12-21",
    summary:
      "Refactored Focus Guardian for the Pollen Robotics ecosystem. Learned the hard way that dashboard plugins work differently than standalone apps.",
    content: `
Getting Focus Guardian into the HuggingFace/Pollen Robotics ecosystem required more than just uploading code. The entire architecture had to change.

## Two Different Paradigms

What we built (standalone):
\`\`\`python
def main():
    robot = get_robot()  # We manage connection
    demo = create_gradio_app()
    demo.launch()  # We control lifecycle
\`\`\`

What Pollen expects (dashboard plugin):
\`\`\`python
class FocusGuardian(ReachyMiniApp):
    def run(self, reachy_mini, stop_event):
        # Robot already connected by daemon
        # Dashboard controls start/stop
        while not stop_event.is_set():
            # Do stuff with reachy_mini
\`\`\`

The key insight: apps in the Reachy Mini ecosystem are **plugins**, not standalone applications.

## The Refactor

Created new package structure with pyproject.toml, moved to ReachyMiniApp inheritance, added stop_event handling for clean shutdown.

## The Publishing Moment

\`\`\`python
from huggingface_hub import HfApi
api = HfApi()
api.upload_folder(
    folder_path="./focus-guardian-hf",
    repo_id="RyeCatcher/focus-guardian",
    repo_type="space"
)
\`\`\`

Result: https://huggingface.co/spaces/RyeCatcher/focus-guardian

## Plot Twist: It's a Static Site

First deploy failed with \`ModuleNotFoundError: No module named 'reachy_mini'\`. Of course — the SDK runs locally where the robot is, not on HF servers!

Fixed by changing \`sdk: gradio\` to \`sdk: static\`. The Space is a *distribution point* (landing page + pip install source), not a running app.

## Lesson Learned

HuggingFace Spaces for Reachy Mini apps serve two purposes: (1) discovery/landing page, (2) pip-installable package. The actual app runs locally.
    `.trim(),
    tags: ["apps", "huggingface", "ecosystem", "architecture"],
    mood: "win",
    readingTime: 4,
    linkedTimeline: ["huggingface-publish"],
  },
  {
    slug: "first-boot",
    title: "First Physical Robot Boot (with Claude Code)",
    date: "2025-12-20",
    summary:
      "45 minutes from 'help me get it running' to a talking robot. Real-time debugging with an AI pair programmer.",
    content: `
Built my Reachy Mini Lite overnight. Woke up, plugged it in via USB, and asked Claude Code for help getting it running. What followed was a real-time debugging session that showcases how AI-assisted development actually works.

## The Problem: Stuck in Simulation Mode

I had been running the simulator the day before. When I connected the physical robot, the daemon was still configured for simulation mode (\`--sim\` flag). The robot was physically connected but the software wasn't talking to it.

**What I said:** "I built my Reachy light. Can you help me get it running?"

**What Claude did:**

1. Immediately checked USB detection: \`ls /dev/tty.usb* /dev/cu.usb*\`
   Result: \`/dev/cu.usbmodem5AF71342721\` — the robot was detected!

2. Checked daemon status: \`ps aux | grep reachy\`
   Found the daemon running with \`--sim --headless\` flags.

3. Diagnosed: Need to switch from sim to hardware mode.

## First Movement: Proof of Life

\`\`\`python
with ReachyMini(media_backend='no_media') as mini:
    mini.goto_target(antennas=[0.6, -0.6], duration=0.5)
    time.sleep(0.6)
    mini.goto_target(antennas=[-0.6, 0.6], duration=0.5)
\`\`\`

The moment those antennas wiggled for the first time. Months of anticipation, reduced to a half-second of servo movement. It worked.

## The Claude Code Advantage

1. **Parallel investigation:** USB detection, daemon status, and doc search simultaneously
2. **Code reading:** Actually read the conversation app source to understand API key validation
3. **Security awareness:** Stored API key in Keychain, not plain text
4. **Documentation:** Created this entry while working

This wasn't just "robot works" — it was a demonstration of AI-assisted hardware debugging.
    `.trim(),
    tags: ["hardware", "debugging", "claude-code", "breakthrough"],
    mood: "win",
    readingTime: 5,
    linkedTimeline: ["first-physical-boot"],
  },
  {
    slug: "first-day",
    title: "Day One: Setting Up the Documentation Site",
    date: "2025-12-21",
    summary:
      "Launched runreachyrun.com to document the Reachy Mini build. Built with Next.js, Tailwind, and Claude Code. The meta-narrative begins.",
    content: `
Today marks the official start of documenting this build publicly. I've been working with the Reachy Mini Lite for about a week now, but everything before today was scattered notes and half-finished experiments.

The site itself is part of the story. I'm using Claude Code to help build it, which means the tool I'm using to document the robot project is also being documented. It's recursive in a way that feels appropriate for an AI project.

## Technical Decisions

- **Next.js 14 with App Router**: Server components where possible, client components for interactivity
- **Tailwind CSS**: No component libraries — building everything custom
- **Framer Motion**: For animations that feel intentional, not decorative
- **Dark mode only**: This is a dev journal, not a marketing site

## What's Working

The timeline component came together faster than expected. Claude Code helped iterate on the design — I described what I wanted, it generated options, I pushed back on the generic parts, and we landed somewhere interesting.

## What's Next

Need to add the journal section (you're reading the first entry), GitHub integration for live commit data, and eventually embed some HuggingFace Spaces.
    `.trim(),
    tags: ["meta", "launch", "claude-code", "next.js"],
    mood: "excited",
    readingTime: 3,
    linkedTimeline: ["site-launch"],
  },
  {
    slug: "first-movement",
    title: "First Successful Coordinated Movement",
    date: "2025-12-16",
    summary:
      "After 3 hours of coordinate system confusion, Reachy finally moved the way I intended. The breakthrough moment.",
    content: `
Three hours. That's how long it took to understand why my head movements were going the wrong direction.

## The Problem

I kept sending commands like \`goto_target(head=create_head_pose(z=20))\` expecting the head to tilt forward. Instead, it was tilting... somewhere else. The documentation mentioned "Z is forward/backward" but forward relative to what?

## The Debugging Session

Claude Code was actually helpful here. I described the behavior I was seeing:

> "When I set z=20, the head tilts to the right instead of forward. When I set roll=20, it tilts forward."

Claude's response pointed me to the coordinate frame origin. The SDK uses a body-centric coordinate system where:
- **Z** is actually the vertical axis (up/down from the robot's perspective)
- **Roll** controls the forward/backward tilt
- **Yaw** controls left/right rotation

## The Fix

\`\`\`python
# What I was doing (wrong mental model)
head = create_head_pose(z=20, mm=True, degrees=True)

# What I needed (correct mental model)
head = create_head_pose(roll=10, mm=True, degrees=True)  # Forward tilt
\`\`\`

## The Moment

When it finally worked — when Reachy turned its head to look at me and wiggled its antennas — I literally laughed out loud. There's something about a robot responding to your commands correctly for the first time that never gets old.

## Lesson Learned

Always verify coordinate systems empirically. Documentation can be ambiguous. Send small test commands and observe before building complex sequences.
    `.trim(),
    tags: ["software", "sdk", "debugging", "coordinates"],
    mood: "win",
    readingTime: 4,
    linkedTimeline: ["first-movement"],
    linkedCommits: ["def5678", "ghi9012"],
  },
  {
    slug: "camera-debugging",
    title: "Camera Integration: A Dead End (For Now)",
    date: "2025-12-17",
    summary:
      "Attempted to integrate head pose detection via the robot's camera. Hit a wall with headless mode. Parking this for later.",
    content: `
Today was supposed to be the day I got head pose detection working. It wasn't.

## The Goal

I wanted Reachy to track faces and maintain eye contact during interactions. The SDK has camera support, so this seemed straightforward.

## What Happened

The camera works fine when running the daemon with a GUI window. But I'm running in headless mode (no physical display attached), and that's where things break.

\`\`\`
Camera timeout: no frames received in 5000ms
\`\`\`

## Debugging Attempts

1. **Different camera initialization flags** — No effect
2. **Forcing OpenCV backend** — Same timeout
3. **Checking if MuJoCo sim provides camera** — It does, but only with the 3D window open
4. **SDK source code dive** — The camera thread expects a running render loop

## The Reality

Headless mode and camera input are architecturally at odds in the current SDK. The camera depends on the render pipeline, which doesn't run without a window.

## Options

1. Run with a virtual framebuffer (Xvfb) — hacky but might work
2. Use external camera + separate face detection pipeline — more work, but cleaner
3. Wait for SDK update — there's a GitHub issue open about this
4. Work around it — build features that don't need camera for now

## Decision

Parking this. I'll focus on apps that use the robot's movements and expressions without real-time vision. The Focus Guardian app can work with keyboard/manual input initially.

## Mood

Frustrated but realistic. Not every session ends with a win. Documenting the dead ends is part of the process.
    `.trim(),
    tags: ["software", "camera", "blocker", "debugging"],
    mood: "struggle",
    readingTime: 4,
    linkedTimeline: ["camera-issues"],
  },
  {
    slug: "focus-guardian-prd",
    title: "Focus Guardian: The Concept",
    date: "2025-12-18",
    summary:
      "Brainstorming session for a productivity app. Reachy as a body double that provides gentle accountability.",
    content: `
Had an idea while procrastinating (ironic): what if Reachy could be a body double?

## The Concept

"Body doubling" is a productivity technique where having another person present — even silently — helps you focus. It's especially useful for ADHD brains. The other person doesn't have to do anything; their presence creates gentle accountability.

What if a robot could do this?

## Focus Guardian Features (v1)

- **Presence mode**: Reachy sits attentively, occasionally shifting position to feel "alive"
- **Focus timer**: Pomodoro-style work sessions with animated transitions
- **Gentle check-ins**: Subtle movements or sounds if you've been idle too long
- **Celebration**: Antenna wiggles and happy expressions when you complete a session

## Why This Could Work

1. It's low-stakes — no judgment, no human awkwardness
2. The robot is inherently engaging — you want to "perform" for it
3. It gamifies focus without being annoying about it
4. It works without camera (see yesterday's frustration)

## Technical Approach

- Gradio UI for the timer and controls
- Keyboard input for "I'm working" / "I'm distracted" signals (for now)
- Pre-built animation sequences for different states
- Optional screen time tracking via system APIs

## Open Questions

- How often should it move to feel present without being distracting?
- What's the right balance of encouragement vs. leaving you alone?
- Should it track breaks, or just work sessions?

## Next Steps

Writing a proper PRD and starting the Gradio scaffold.
    `.trim(),
    tags: ["apps", "focus-guardian", "concept", "productivity"],
    mood: "excited",
    readingTime: 3,
    linkedTimeline: ["focus-guardian-concept"],
  },
  {
    slug: "simulation-setup",
    title: "MuJoCo Simulation: Now We're Cooking",
    date: "2025-12-14",
    summary:
      "Got the physics simulation running in headless mode. I can now develop without the physical robot.",
    content: `
Major infrastructure win today. The MuJoCo simulation is working, which means I can:

1. Develop when the robot isn't connected
2. Test potentially dangerous movements safely
3. Iterate faster (no physical constraints)
4. Record demos without the physical hardware

## Setup

The SDK ships with MuJoCo 3.3.0 support. Running in simulation mode:

\`\`\`bash
python -m reachy_mini.daemon.app.main --sim --headless --fastapi-port 8000
\`\`\`

The \`--headless\` flag is key for running from scripts/CI. Without it, MuJoCo tries to open a 3D window.

## What Works

- All movement commands
- Antenna control
- Head poses
- Position feedback
- The REST API at localhost:8000

## What Doesn't

- Camera (see future debugging session)
- Audio (no physical speakers to simulate)
- Some edge cases in collision detection

## LaunchAgent Setup

I set up a LaunchAgent so the daemon starts automatically on login:

\`\`\`xml
~/Library/LaunchAgents/com.bioinfo.reachy-daemon.plist
\`\`\`

Now I can just write code and trust the daemon is running. If it crashes, launchd restarts it.

## Feeling

Productive. Having the simulation layer means I can move faster on software without being blocked by hardware logistics.
    `.trim(),
    tags: ["software", "simulation", "mujoco", "infrastructure"],
    mood: "win",
    readingTime: 3,
    linkedTimeline: ["simulation-working"],
    linkedCommits: ["mno7890"],
  },
  {
    slug: "dj-reactor-start",
    title: "DJ Reactor: Making Reachy Dance",
    date: "2025-12-20",
    summary:
      "Started work on a music-reactive app. Reachy will respond to beats with synchronized movements.",
    content: `
New app idea: DJ Reactor. Reachy reacts to music in real-time.

## The Vision

Play any song, and Reachy:
- Bobs its head to the beat
- Wiggles antennas on drops
- Changes expressions based on energy level
- Maybe tracks specific instruments

## Technical Approach

Using \`librosa\` for audio analysis:

\`\`\`python
import librosa

# Load audio
y, sr = librosa.load('track.mp3')

# Beat tracking
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

# Energy over time
rms = librosa.feature.rms(y=y)
\`\`\`

Then mapping these features to robot movements:
- Beat → head bob (quick up/down on Z)
- Energy → antenna spread (more energy = wider)
- Onset detection → eye reactions

## Challenges

1. **Latency**: Audio analysis needs to be fast enough for real-time response
2. **Smoothing**: Raw beat detection is jittery; need to smooth movements
3. **Not looking stupid**: Easy to make the robot look like it's having a seizure

## First Prototype

Got basic beat detection working. Reachy bobs on every detected beat. It's... okay. Needs work on timing and amplitude.

## What's Next

- Add energy-based modulation
- Implement anticipation (move slightly before the beat, not after)
- Build a simple Gradio UI for track selection

This one's going to be fun.
    `.trim(),
    tags: ["apps", "dj-reactor", "audio", "librosa"],
    mood: "excited",
    readingTime: 3,
    linkedTimeline: ["dj-reactor-start"],
  },
];

// Helper to get entries sorted by date (newest first)
export function getEntriesSorted(): JournalEntry[] {
  return [...journalEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Helper to get entry by slug
export function getEntryBySlug(slug: string): JournalEntry | undefined {
  return journalEntries.find((entry) => entry.slug === slug);
}

// Helper to get entries by tag
export function getEntriesByTag(tag: string): JournalEntry[] {
  return journalEntries.filter((entry) => entry.tags.includes(tag));
}

// Helper to get entries by mood
export function getEntriesByMood(mood: JournalEntry["mood"]): JournalEntry[] {
  return journalEntries.filter((entry) => entry.mood === mood);
}

// Get all unique tags
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  journalEntries.forEach((entry) => entry.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

// Get all slugs (for static generation)
export function getAllSlugs(): string[] {
  return journalEntries.map((entry) => entry.slug);
}
