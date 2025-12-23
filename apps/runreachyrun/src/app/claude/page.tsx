"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { SignalLine } from "@/components/ui/signal-line";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/date";
import { getClaudeSessionsSorted, type ClaudeSession as GeneratedSession } from "@/content/claude/data";

interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

interface ClaudeSession {
  id: string;
  date: string;
  goal: string;
  outcome: "success" | "partial" | "pivot" | "blocked" | "in-progress";
  summary: string;
  prompts?: {
    prompt: string;
    insight: string;
    code?: CodeSnippet;
  }[];
  codeSnippets?: CodeSnippet[];
  learnings?: string[];
  linkedFeature?: string;
}

// Rich hand-curated sessions with detailed prompts and insights
const curatedSessions: ClaudeSession[] = [
  {
    id: "echo-mvp",
    date: "2025-12-22",
    goal: "Build a companion app that remembers users across sessions",
    outcome: "success",
    summary:
      "Created Reachy Echo from scratch — a robot companion with persistent memory, multi-model LLM backend, and proactive behaviors. The key insight: memory transforms an assistant into a relationship.",
    prompts: [
      {
        prompt: "Most robot assistants forget you exist between sessions. Build something that remembers.",
        insight: "Claude designed a three-table SQLite schema: user_facts (persistent knowledge), conversation_sessions (summaries), daily_log (greeting tracking). Automatic fact extraction from natural conversation.",
        code: {
          language: "python",
          code: `# Memory architecture
class MemoryManager:
    def extract_facts(self, message: str) -> list[str]:
        """LLM extracts facts like 'user's name is Justin'"""

    def get_context(self) -> str:
        """Build context from facts + recent history"""
        facts = self.storage.get_facts()
        recent = self.storage.get_recent_messages(10)
        return f"Known facts:\\n{facts}\\n\\nRecent:\\n{recent}"`,
          description: "Memory-first architecture"
        }
      },
      {
        prompt: "Make it proactive — greet me in the morning, remind me to take breaks.",
        insight: "Built a trigger-based engine with time/duration/pattern triggers and cooldown management. The robot initiates, not just responds.",
      },
    ],
    learnings: [
      "Memory transforms assistants into companions — knowing someone's name changes everything",
      "Proactive engagement needs careful rate limiting; too eager becomes annoying",
      "LiteLLM proxy lets you hot-swap between 18+ models mid-conversation",
    ],
    linkedFeature: "Reachy Echo",
  },
  {
    id: "rag-system",
    date: "2025-12-22",
    goal: "Add AI chat to the site with zero runtime cost",
    outcome: "success",
    summary:
      "Built a complete RAG system: pre-computed embeddings at build time, client-side vector search, free-tier LLM. Users can ask questions about the project and get grounded answers.",
    prompts: [
      {
        prompt: "I want users to chat with AI about the project, but I don't want ongoing costs.",
        insight: "Claude proposed pre-computing everything. Generate embeddings locally with Nomic, store as JSON, run cosine similarity in the browser. Only the final LLM call goes to the server.",
        code: {
          language: "typescript",
          code: `// Client-side vector search
export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

// Find relevant docs without any API calls
const results = documents
  .map(doc => ({ doc, score: cosineSimilarity(queryEmb, doc.embedding) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);`,
          description: "Zero-cost vector search in the browser"
        }
      },
    ],
    learnings: [
      "Pre-computed embeddings eliminate per-query costs entirely",
      "768-dim Nomic embeddings give better results than smaller models",
      "Free LLM tiers work fine for low-traffic sites — Gemini Flash Lite handles it",
    ],
    linkedFeature: "RAG System",
  },
  {
    id: "app-store-community",
    date: "2025-12-22",
    goal: "Get apps into official Pollen store and handle first community feedback",
    outcome: "success",
    summary:
      "Both apps accepted into the official app store. Hours later, first external PR arrived — a community member fixed a bug I'd missed. The open source loop closed.",
    prompts: [
      {
        prompt: "The validation check is failing. What's the naming convention?",
        insight: "Claude found the requirement: class must be ReachyMini{AppName}, not {AppName}App. Also caught the __main__ block using the old class name.",
        code: {
          language: "python",
          code: `# Before (failed validation)
class DJReactorApp(ReachyMiniApp):
    ...
if __name__ == "__main__":
    DJReactorApp().wrapped_run()

# After (passed)
class ReachyMiniDjReactor(ReachyMiniApp):
    ...
if __name__ == "__main__":
    ReachyMiniDjReactor().wrapped_run()`,
          description: "Naming convention fix for app store"
        }
      },
    ],
    learnings: [
      "Official ecosystems have naming conventions — check the validator early",
      "Building in public attracts contributors who care about quality",
      "External bug reports often find issues you'd never hit locally",
    ],
    linkedFeature: "App Store",
  },
  {
    id: "hardware-debugging",
    date: "2025-12-20",
    goal: "Get physical Reachy Mini running from scratch",
    outcome: "success",
    summary:
      "45 minutes from 'help me get it running' to a talking robot. Debugged sim-vs-hardware daemon modes, serial port locking, and API key storage in real-time.",
    prompts: [
      {
        prompt: "I built my Reachy light. Can you help me get it running?",
        insight: "Starting with broad requests lets Claude investigate systematically — USB detection, daemon status, then targeted fixes.",
        code: {
          language: "bash",
          code: `# Claude's diagnostic sequence
ls /dev/tty.usb* /dev/cu.usb*
# Found: /dev/cu.usbmodem5AF71342721

ps aux | grep "reachy_mini.daemon"
# Found running with --sim flag - that's the problem!`,
          description: "Real-time hardware diagnostics"
        }
      },
      {
        prompt: "The conversation app won't accept my API key even though curl validates it.",
        insight: "Claude traced the issue through source code: apps installed in sim mode don't carry over. The key was valid; the app needed reinstalling.",
      },
    ],
    codeSnippets: [
      {
        language: "python",
        code: `# First movement - proof of life
with ReachyMini(media_backend='no_media') as mini:
    mini.goto_target(antennas=[0.6, -0.6], duration=0.5)
    time.sleep(0.6)
    mini.goto_target(antennas=[-0.6, 0.6], duration=0.5)`,
        description: "The moment the robot first moved"
      }
    ],
    learnings: [
      "Simulation and hardware modes are separate contexts — apps and configs don't carry over",
      "Claude can read SDK source code to understand why something is failing",
      "Having an AI that executes commands while explaining what it's looking for is powerful for hardware debugging",
    ],
    linkedFeature: "Physical Robot",
  },
  {
    id: "huggingface-ecosystem",
    date: "2025-12-21",
    goal: "Publish Focus Guardian to HuggingFace Spaces",
    outcome: "success",
    summary:
      "Discovered the Pollen Robotics ecosystem expects dashboard plugins, not standalone apps. Refactored to ReachyMiniApp pattern and learned Spaces serve as distribution points, not runtime environments.",
    prompts: [
      {
        prompt: "How do I get Focus Guardian into the Pollen Robotics app store?",
        insight: "The question revealed an architecture mismatch. Claude explained the ReachyMiniApp pattern: apps receive pre-initialized robots and respect stop_event.",
        code: {
          language: "python",
          code: `# Before: standalone app
def main():
    robot = get_robot()  # We manage connection
    demo = create_gradio_app()
    demo.launch()  # We control lifecycle

# After: dashboard plugin
class FocusGuardian(ReachyMiniApp):
    def run(self, reachy_mini, stop_event):
        # Robot already connected by daemon
        while not stop_event.is_set():
            # Do stuff with reachy_mini`,
          description: "Architecture paradigm shift"
        }
      },
      {
        prompt: "Deploy failed with 'No module named reachy_mini' — the SDK isn't on HuggingFace servers.",
        insight: "Spaces for Reachy apps are static landing pages + pip install sources, not running apps. Changed sdk: gradio to sdk: static.",
      },
    ],
    learnings: [
      "Ecosystem integration often requires architectural changes, not just deployment",
      "Dashboard plugins vs standalone apps is a fundamental paradigm difference",
      "HuggingFace Spaces can serve as package distribution even without runtime execution",
    ],
    linkedFeature: "HuggingFace Integration",
  },
  {
    id: "dj-reactor-audio",
    date: "2025-12-20",
    goal: "Build real-time audio-reactive robot movements",
    outcome: "success",
    summary:
      "Created DJ Reactor with 7 genre presets. Claude designed the audio pipeline architecture with FFT analysis, beat detection, and movement mapping running in parallel threads.",
    prompts: [
      {
        prompt: "How do I process audio in real-time without blocking the robot control loop?",
        insight: "Claude proposed buffered FFT with separate threads for audio capture, analysis, and robot commands. The pipeline prevents jitter.",
        code: {
          language: "python",
          code: `# Audio pipeline architecture
class AudioAnalyzer:
    def __init__(self):
        self.buffer = np.zeros(BUFFER_SIZE)
        self.beat_detected = threading.Event()

    def analyze_loop(self):
        while self.running:
            chunk = self.stream.read(CHUNK)
            self.buffer = np.roll(self.buffer, -CHUNK)
            self.buffer[-CHUNK:] = chunk

            # FFT analysis
            fft = np.abs(np.fft.rfft(self.buffer))
            bass = np.mean(fft[BASS_RANGE])

            if bass > self.threshold:
                self.beat_detected.set()`,
          description: "Thread-safe audio processing"
        }
      },
      {
        prompt: "Make the movements feel natural, not jerky.",
        insight: "Added movement smoothing, anticipation (move slightly before the beat), and randomization. Each genre preset defines its own movement personality.",
      },
    ],
    learnings: [
      "Real-time audio requires careful buffer sizing — too small misses beats, too large adds latency",
      "Genre-specific movement presets make the same beat detection feel completely different",
      "The antenna waggle is the secret weapon — expressive with minimal motor wear",
    ],
    linkedFeature: "DJ Reactor",
  },
  {
    id: "design-system",
    date: "2025-12-21",
    goal: "Create a unique visual identity for runreachyrun.com",
    outcome: "success",
    summary:
      "Developed the signal-inspired design system with dark theme, cyan/amber accents, and animated components. The 'transmission active' motif emerged from discussing how to make the site feel alive.",
    prompts: [
      {
        prompt: "This site should look like nothing else. No templates, no generic patterns.",
        insight: "Constraints that reject defaults force more creative solutions. The 'signal' concept came from brainstorming what makes robot communication feel distinct.",
      },
      {
        prompt: "Dark-first. Motion with purpose. Show the work.",
        insight: "These three principles guided every component decision. Motion only when it reveals information or guides attention.",
      },
    ],
    learnings: [
      "Starting with design principles before components leads to more cohesive systems",
      "Naming things well (SignalBadge, SignalLine) helps maintain conceptual consistency",
    ],
    linkedFeature: "Design System",
  },
  {
    id: "timeline-architecture",
    date: "2025-12-21",
    goal: "Build an interactive timeline that's the centerpiece of the site",
    outcome: "success",
    summary:
      "Created expandable timeline nodes with filtering by type and tag, media grids, commit links, and Claude snippet display. The bidirectional linking to journal entries emerged during implementation.",
    prompts: [
      {
        prompt: "Each node should be able to show: journal excerpt, commit links, media, and Claude conversation snippets",
        insight: "Complex data structures benefit from TypeScript interfaces defined upfront. The TimelineNode interface drove the entire implementation.",
      },
    ],
    learnings: [
      "Progressive disclosure (expand/collapse) prevents overwhelming users",
      "Filtering should feel instant — client-side for small datasets",
      "Linking content bidirectionally (timeline ↔ journal) creates a richer navigation experience",
    ],
    linkedFeature: "Timeline",
  },
  {
    id: "github-integration",
    date: "2025-12-21",
    goal: "Show live GitHub activity with graceful fallbacks",
    outcome: "success",
    summary:
      "Built API route with caching, rate limit awareness, and fallback data. The dashboard shows recent commits and repo stats, updating every 5 minutes.",
    prompts: [
      {
        prompt: "GitHub API works without auth at 60 req/hr. Add fallback data for when it's unavailable.",
        insight: "Always design for failure. The fallback data means the site never shows a broken state.",
      },
    ],
    learnings: [
      "Next.js API routes with revalidation are perfect for third-party API caching",
      "Fallback data should match the real data structure exactly",
      "Show users when data is live vs. cached (the 'live' badge)",
    ],
    linkedFeature: "GitHub Activity",
  },
  {
    id: "this-page",
    date: "2025-12-21",
    goal: "Create a dedicated page documenting Claude Code's role",
    outcome: "success",
    summary:
      "You're looking at it. Meta, right? This page documents how Claude helped build the project, including itself.",
    learnings: [
      "The recursive nature of AI-assisted development is worth showing, not hiding",
      "Documenting prompts and learnings creates a knowledge base for future sessions",
    ],
    linkedFeature: "Claude Page",
  },
];

// Merge curated sessions with auto-generated ones
// Curated sessions take precedence (have richer content with prompts/insights)
const generatedSessions = getClaudeSessionsSorted();
const curatedIds = new Set(curatedSessions.map((s) => s.id));

// Get generated sessions that aren't already curated
const additionalSessions: ClaudeSession[] = generatedSessions
  .filter((s) => !curatedIds.has(s.id))
  .map((s) => ({
    ...s,
    outcome: s.outcome as ClaudeSession["outcome"],
  }));

// Combine and sort by date (newest first)
const sessions: ClaudeSession[] = [...curatedSessions, ...additionalSessions].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

const tips = [
  {
    title: "Be specific about constraints",
    description:
      "Instead of 'make it look good', say 'dark theme, no generic patterns, motion only when purposeful'. Constraints drive creativity.",
    icon: "Target",
  },
  {
    title: "Define data structures first",
    description:
      "TypeScript interfaces before implementation. Claude writes better code when it knows the shape of the data.",
    icon: "Ruler",
  },
  {
    title: "Design for failure",
    description:
      "Always ask about fallbacks, error states, and edge cases. Claude will implement them if you specify them.",
    icon: "Shield",
  },
  {
    title: "Iterate in conversation",
    description:
      "First attempt rarely perfect. Review, request changes, refine. The dialogue is the development process.",
    icon: "RefreshCcw",
  },
  {
    title: "Name things well",
    description:
      "Good names (SignalBadge, not Badge) help Claude maintain conceptual consistency across components.",
    icon: "Tag",
  },
  {
    title: "Show, don't hide",
    description:
      "Credit Claude explicitly. Document the collaboration. It's part of the honest story of how things get built.",
    icon: "Eye",
  },
];

const stats = {
  sessions: sessions.length,
  features: new Set(sessions.map((s) => s.linkedFeature).filter(Boolean)).size,
  learnings: sessions.reduce((acc, s) => acc + (s.learnings?.length || 0), 0),
};

function CodeBlock({ snippet }: { snippet: CodeSnippet }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--accent-cyan)]">
            {snippet.language}
          </span>
          {snippet.description && (
            <span className="text-xs text-[var(--text-muted)]">
              — {snippet.description}
            </span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      <pre className="p-3 bg-[var(--bg-secondary)] overflow-x-auto">
        <code className="font-mono text-xs text-[var(--text-secondary)] whitespace-pre">
          {snippet.code}
        </code>
      </pre>
    </div>
  );
}

function SessionCard({ session }: { session: ClaudeSession }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const outcomeVariant =
    session.outcome === "success"
      ? "success"
      : session.outcome === "partial" || session.outcome === "in-progress"
        ? "amber"
        : session.outcome === "blocked"
          ? "default"
          : "default";

  return (
    <Card variant="interactive" className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SignalBadge variant={outcomeVariant}>
                {session.outcome}
              </SignalBadge>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {formatDate(session.date, { month: "short", day: "numeric" })}
              </span>
            </div>
            <h3 className="font-medium text-[var(--text-primary)] mb-1">
              {session.goal}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {session.summary}
            </p>
          </div>
          <span
            className={`text-[var(--text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--border-subtle)]"
          >
            <div className="p-5 space-y-4">
              {session.prompts && session.prompts.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-[var(--text-muted)] mb-3">
                    key prompts & insights
                  </p>
                  <div className="space-y-4">
                    {session.prompts.map((p, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[var(--bg-tertiary)] border-l-2 border-[var(--accent-amber)]"
                      >
                        <p className="text-sm text-[var(--text-primary)] italic mb-2">
                          "{p.prompt}"
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {p.insight}
                        </p>
                        {p.code && <CodeBlock snippet={p.code} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.codeSnippets && session.codeSnippets.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-[var(--text-muted)] mb-3">
                    code from this session
                  </p>
                  <div className="space-y-3">
                    {session.codeSnippets.map((snippet, i) => (
                      <CodeBlock key={i} snippet={snippet} />
                    ))}
                  </div>
                </div>
              )}

              {session.learnings && session.learnings.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-[var(--text-muted)] mb-2">
                    learnings
                  </p>
                  <ul className="space-y-1">
                    {session.learnings.map((learning, i) => (
                      <li
                        key={i}
                        className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                      >
                        <span className="text-[var(--accent-cyan)]">→</span>
                        {learning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session.linkedFeature && (
                <div className="pt-2">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    resulted in:{" "}
                  </span>
                  <span className="text-xs font-mono text-[var(--accent-cyan)]">
                    {session.linkedFeature}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function ClaudePage() {
  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-mono font-bold text-[var(--text-primary)]">
                Built with Claude Code
              </h1>
              <SignalBadge variant="amber" pulse>
                meta
              </SignalBadge>
            </div>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              This entire project — the robot apps, this website, even this page
              — is built in collaboration with Claude Code. Here's how that
              actually works.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
          >
            <Card className="p-4 text-center">
              <p className="text-2xl font-mono font-bold text-[var(--accent-cyan)]">
                {stats.sessions}
              </p>
              <p className="text-xs text-[var(--text-muted)]">sessions</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-mono font-bold text-[var(--accent-amber)]">
                {stats.features}
              </p>
              <p className="text-xs text-[var(--text-muted)]">features built</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-mono font-bold text-[var(--semantic-success)]">
                {stats.learnings}
              </p>
              <p className="text-xs text-[var(--text-muted)]">learnings captured</p>
            </Card>
          </motion.div>

          {/* The Meta Story */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-16"
          >
            <Card className="p-6 border-l-4 border-[var(--accent-amber)]">
              <h2 className="text-lg font-mono font-medium text-[var(--text-primary)] mb-3">
                The Recursive Nature of This
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Claude Code is helping build a Reachy Mini robot. It's also
                building this website that documents building the robot. And
                it's writing the content about both. Including this paragraph
                explaining that very recursion.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                This isn't a gimmick — it's honest documentation. AI-assisted
                development is part of how modern software gets made. Hiding it
                would be dishonest. Showing it might be useful to others
                figuring out their own workflows.
              </p>
            </Card>
          </motion.section>

          {/* Sessions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
              Development Sessions
            </h2>
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                >
                  <SessionCard session={session} />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Tips */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-mono font-medium text-[var(--text-primary)]">
                What I've Learned
              </h2>
              <SignalBadge variant="cyan">tips</SignalBadge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tips.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                >
                  <Card className="p-5 h-full">
                    <div className="mb-3 text-[var(--accent-cyan)]">
                      <Icon name={tip.icon} size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {tip.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="text-center py-12 border-t border-[var(--border-subtle)]"
          >
            <SignalLine animate className="opacity-30 mb-8" />
            <p className="text-[var(--text-secondary)] mb-4">
              Want to try Claude Code yourself?
            </p>
            <a
              href="https://www.anthropic.com/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-amber)] text-[var(--bg-primary)] font-mono text-sm rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Claude Code &rarr;
            </a>
          </motion.section>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm transition-colors"
            >
              &larr; back to home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
