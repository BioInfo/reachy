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

interface ClaudeSession {
  id: string;
  date: string;
  goal: string;
  outcome: "success" | "partial" | "pivot";
  summary: string;
  prompts?: {
    prompt: string;
    insight: string;
  }[];
  learnings?: string[];
  linkedFeature?: string;
}

const sessions: ClaudeSession[] = [
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

function SessionCard({ session }: { session: ClaudeSession }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const outcomeVariant =
    session.outcome === "success"
      ? "success"
      : session.outcome === "partial"
        ? "amber"
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
                {new Date(session.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
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
                  <div className="space-y-3">
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
                      </div>
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
              href="https://claude.ai/download"
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
