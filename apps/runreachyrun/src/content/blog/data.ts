import { BlogPost } from "@/types";

// Upcoming/planned blog posts (shown as "On the Writing List")
export interface UpcomingPost {
  title: string;
  status: "idea" | "draft";
  hook: string;
  angle?: string;
  target?: string;
}

export const upcomingPosts: UpcomingPost[] = [
  {
    title: "Zero-Cost RAG: AI Chat Without the Cloud Bill",
    status: "idea",
    hook: "Most RAG systems cost hundreds per month. Mine costs exactly $0.",
    angle: "Technical deep-dive on pre-computed embeddings, client-side vector search, and free-tier LLMs",
    target: "Run Data Run",
  },
  {
    title: "When Simulation Meets Reality",
    status: "idea",
    hook: "Everything worked perfectly in simulation. Then I connected the real robot.",
    angle: "The gaps between MuJoCo physics and actual servo behavior - what breaks and why",
  },
  {
    title: "Making a Robot Dance: DJ Reactor Deep Dive",
    status: "idea",
    hook: "Real-time beat detection with 50ms latency on a $200 robot",
    angle: "FFT analysis, movement choreography, and why antenna waggles are the secret weapon",
  },
  {
    title: "The Focus Guardian Experiment",
    status: "idea",
    hook: "Can a robot help you focus? I built one to find out.",
    angle: "Body-doubling technique, attention tracking, and the psychology of robot accountability partners",
  },
  {
    title: "Building in Public with Reachy Mini",
    status: "idea",
    hook: "Why I'm documenting this journey and what I hope to learn",
    angle: "The meta-story of using Claude Code to build the documentation system that documents using Claude Code",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "first-boot-with-claude",
    title: "First Boot: Debugging a Robot with an AI Pair Programmer",
    date: "2025-12-20",
    summary:
      "I built a robot and debugged it with an AI pair programmer reading source code and executing commands in real-time. Not just 'robot works' but the human-AI collaboration story.",
    content: `
I built my Reachy Mini Lite overnight. Woke up at 6am, plugged it in via USB, and asked Claude Code for help getting it running. Forty-five minutes later, the robot was talking back to me.

This is the story of that debugging session. Not the polished "and then it worked" version. The actual sequence of problems, wrong turns, and the moments where having an AI read source code in real-time made the difference.

I've [written about AI coding assistants before](https://rundatarun.io/p/a-deep-dive-into-ai-coding-assistants) and [compared Claude Code to other tools](https://rundatarun.io/p/the-battle-for-ai-powered-development). This is the first time I've used one for hardware debugging. The experience was different from software development in ways I didn't expect.

## The Setup

I'd been running the Reachy Mini in simulation mode for a week, building and testing apps. The simulator uses MuJoCo for physics, and the code works identically on hardware. In theory.

The physical robot arrived. I assembled it, connected via USB, and got nothing. Well, not nothing. The robot was detected. It just wasn't responding to commands.

## Stuck in Simulation Mode

The daemon (the background service that manages robot communication) was still configured for simulation. I'd been running \`--sim --headless\` flags for a week. The robot was physically there, but the software wasn't talking to it.

My prompt was simple: "I built my Reachy light. Can you help me get it running?"

Claude checked USB detection first:

\`\`\`bash
ls /dev/tty.usb* /dev/cu.usb*
\`\`\`

Result: \`/dev/cu.usbmodem5AF71342721\`. The robot was detected.

Then daemon status:

\`\`\`bash
ps aux | grep "reachy_mini.daemon"
\`\`\`

Found it running with \`--sim --headless --fastapi-port 8000\`. Simulation mode. The diagnosis was immediate: stop the sim daemon, start one for hardware.

## Serial Port Locking

Claude stopped the simulation daemon and tried to start the hardware daemon. Error: "Device or resource busy."

The serial port was still locked by the previous process. Python's serial connections don't always release cleanly. This is the kind of thing that takes 20 minutes to figure out alone. Claude diagnosed it in 30 seconds.

The fix:
\`\`\`bash
pkill -9 -f "reachy"
sleep 2
python -m reachy_mini.daemon.app.main --headless --fastapi-port 8000
\`\`\`

Daemon started. Nine motors initialized. The robot was listening.

## Proof of Life

Claude ran a test script:

\`\`\`python
from reachy_mini import ReachyMini

with ReachyMini(media_backend='no_media') as mini:
    mini.goto_target(antennas=[0.6, -0.6], duration=0.5)
    time.sleep(0.6)
    mini.goto_target(antennas=[-0.6, 0.6], duration=0.5)
\`\`\`

The antennas wiggled. First physical movement from code I'd written. That moment never gets old. Months of anticipation reduced to a half-second of servo movement.

## The API Key Mystery

Next challenge: the conversation app (Talk with Reachy Mini) wouldn't accept my OpenAI API key.

Error: "Failed to validate/save key. Please try again."

I knew the key was valid. I'd tested it with curl. So why wouldn't the app accept it?

This is where Claude's ability to read source code became useful. It found the validation code in the installed package:
\`\`\`bash
grep -r "Failed to validate" ~/apps/reachy/venv/lib/python3.12/site-packages/reachy_mini_conversation_app/
\`\`\`

Then read the actual validation function. It was making a test API call, same as curl. The key itself wasn't the issue.

The actual problem: apps installed during simulation mode don't carry over to hardware mode. The conversation app needed to be reinstalled from the dashboard. Claude didn't guess. It traced the issue through the implementation.

## The 45-Minute Timeline

- 0:00. "Help me get it running"
- 0:02. USB detected, daemon diagnosed as sim mode
- 0:05. First attempt to start hardware daemon, serial port busy
- 0:08. Port freed, daemon restarted for hardware
- 0:12. Antennas wiggle. First successful movement
- 0:15. Conversation app won't accept API key
- 0:25. Claude traces through validation source code
- 0:30. Reinstall app from dashboard
- 0:35. API key stored securely in Keychain
- 0:40. Conversation app working, robot talks
- 0:45. Session documented, daemon configured for auto-start

## The Difference

Here's what stood out about using Claude Code for hardware debugging versus software development.

Parallel investigation. USB detection, daemon status, and documentation search happened simultaneously. Claude wasn't waiting for one thing to finish before starting another. When you're debugging hardware, you often don't know which hypothesis is correct. Being able to test multiple at once saves time.

Source code reading. When the API key issue didn't make sense, Claude found and read the validation code. It understood why something was failing, not just that it was failing. This is different from typical debugging where you're reading your own code. Here, Claude was reading library internals I'd never seen.

Security awareness. When we needed to store the API key, Claude set it up in macOS Keychain rather than leaving it in a config file or environment variable. Small thing, but it's the kind of detail that gets skipped when you're rushing to make something work.

Real-time documentation. Claude created the journal entry while debugging. The process was documented as it happened. I've tried to document debugging sessions after the fact. You forget details. Having it captured in real-time is genuinely useful for future reference.

## The Tradeoff

This isn't free. I'm running Opus, which costs more than Sonnet or Haiku. For a 45-minute debugging session, the cost was a few dollars. Worth it for getting the robot running quickly. Probably overkill for simpler problems where I already know where to look.

The bigger question is whether this changes how I approach hardware problems. I think it does. I'm more likely to try parallel hypotheses now. More likely to dig into library source code. The barrier to investigation is lower when you have a tool that reads faster than you do.

## What's Next

This was day one with the physical robot. I've got two apps built (Focus Guardian and DJ Reactor), both tested in simulation. Now they run on hardware. The next posts will cover what breaks when simulation meets reality, and how the apps behave differently with actual servos.

The code is at [github.com/BioInfo/reachy](https://github.com/BioInfo/reachy). The build log is at [runreachyrun.com](https://runreachyrun.com).
    `.trim(),
    tags: ["hardware", "claude-code", "debugging", "robotics"],
    readingTime: 8,
    crossPostedTo: "rundatarun.io",
  },
];

// Helper to get posts sorted by date (newest first)
export function getPostsSorted(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Helper to get post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

// Helper to get all slugs (for static generation)
export function getAllSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
