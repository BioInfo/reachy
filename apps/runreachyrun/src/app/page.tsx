"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { SignalLine } from "@/components/ui/signal-line";
import { Card } from "@/components/ui/card";
import { getTimelineSorted } from "@/content/timeline/data";

const recentTimeline = getTimelineSorted().slice(0, 4);

const typeColors: Record<string, "cyan" | "amber" | "success" | "failure" | "default"> = {
  milestone: "cyan",
  breakthrough: "success",
  failure: "failure",
  session: "default",
  blog: "amber",
};

export default function Home() {
  return (
    <>
      <Nav />

      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)] to-[var(--bg-secondary)]" />

          {/* Animated signal lines in background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-0 right-0">
              <SignalLine animate />
            </div>
            <div className="absolute top-2/4 left-0 right-0">
              <SignalLine animate />
            </div>
            <div className="absolute top-3/4 left-0 right-0">
              <SignalLine animate />
            </div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SignalBadge variant="cyan" pulse className="mb-8">
                transmission active
              </SignalBadge>

              <h1 className="text-5xl md:text-7xl font-mono font-bold text-[var(--text-primary)] mb-6 tracking-tight">
                run
                <span className="text-gradient-cyan">reachy</span>
                run
              </h1>

              <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
                Building a Reachy Mini Lite robot. Documenting every step —
                the wins, the failures, and the code in between.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/timeline"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-mono font-medium rounded-lg hover:bg-[var(--accent-cyan-dim)] transition-colors"
                >
                  Explore Timeline
                  <span aria-hidden="true">&rarr;</span>
                </Link>
                <Link
                  href="/journal"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--border-default)] text-[var(--text-primary)] font-mono font-medium rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
                >
                  Read Journal
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="py-24 bg-[var(--bg-secondary)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)] mb-2">
                  Recent Transmissions
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Latest updates from the build
                </p>
              </div>
              <Link
                href="/timeline"
                className="text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] font-mono text-sm transition-colors"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentTimeline.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card variant="interactive" className="p-6 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <SignalBadge variant={typeColors[node.type]}>
                        {node.type}
                      </SignalBadge>
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        {new Date(node.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                      {node.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      {node.summary}
                    </p>
                    {node.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {node.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-xs text-[var(--text-muted)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What is this Section */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)] mb-4">
                What is this?
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                This site documents my journey building apps and experiments
                with a{" "}
                <a
                  href="https://www.pollen-robotics.com/reachy-mini/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-cyan)] hover:underline"
                >
                  Reachy Mini Lite
                </a>{" "}
                robot. Every session, every breakthrough, every failure —
                captured as it happens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--accent-cyan-glow)] flex items-center justify-center">
                  <span className="text-[var(--accent-cyan)] text-xl">⏱</span>
                </div>
                <h3 className="font-mono font-medium text-[var(--text-primary)] mb-2">
                  Timeline
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Follow the build chronologically. See what worked and what
                  didn't.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--accent-amber-glow)] flex items-center justify-center">
                  <span className="text-[var(--accent-amber)] text-xl">📓</span>
                </div>
                <h3 className="font-mono font-medium text-[var(--text-primary)] mb-2">
                  Journal
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Raw session notes and decisions. The unpolished reality of
                  building.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgba(74,222,128,0.15)] flex items-center justify-center">
                  <span className="text-[var(--semantic-success)] text-xl">
                    🤖
                  </span>
                </div>
                <h3 className="font-mono font-medium text-[var(--text-primary)] mb-2">
                  Apps
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Interactive demos and HuggingFace Spaces. Try what I've
                  built.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About / Meta Section */}
        <section className="py-24 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-start gap-12">
              <div className="flex-1">
                <SignalBadge variant="amber" className="mb-4">
                  meta
                </SignalBadge>
                <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)] mb-4">
                  Built with Claude Code
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                  This site is itself a collaboration. I'm using{" "}
                  <a
                    href="https://claude.ai/claude-code"
                    className="text-[var(--accent-cyan)] hover:underline"
                  >
                    Claude Code
                  </a>{" "}
                  to help build the robot, build this website, and write the
                  content about both.
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Occasionally you'll see how Claude contributed — not as a
                  gimmick, but because it's part of the honest documentation of
                  how this project gets made.
                </p>
              </div>
              <div className="flex-1">
                <Card className="p-6">
                  <p className="font-mono text-sm text-[var(--text-muted)] mb-2">
                    from rundatarun.io
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    I write about AI and data science at{" "}
                    <a
                      href="https://rundatarun.io"
                      className="text-[var(--accent-cyan)] hover:underline"
                    >
                      rundatarun.io
                    </a>
                    . This is the robotics spinoff — same voice, more servos.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
