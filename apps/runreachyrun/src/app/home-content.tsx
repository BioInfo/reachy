"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SignalBadge } from "@/components/ui/signal-badge";
import { SignalLine } from "@/components/ui/signal-line";
import { Card } from "@/components/ui/card";
import { AnimatedBackground, GlowOrb } from "@/components/ui/animated-background";
import { Clock, BookOpen, Bot } from "lucide-react";
import { GitHubActivity } from "@/components/dashboard/github-activity";
import { AppsShowcase, ClaudeShowcase } from "@/components/showcase";
import { formatDate } from "@/lib/date";
import type { TimelineNode } from "@/types";

const typeColors: Record<
  string,
  "cyan" | "amber" | "success" | "failure" | "default"
> = {
  milestone: "cyan",
  breakthrough: "success",
  failure: "failure",
  session: "default",
  blog: "amber",
};

interface HomeContentProps {
  recentTimeline: TimelineNode[];
}

export function HomeContent({ recentTimeline }: HomeContentProps) {
  return (
    <main className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)] to-[var(--bg-secondary)]" />

        {/* Animated canvas background */}
        <AnimatedBackground />

        {/* Central glow effect */}
        <GlowOrb />

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
          {/* Animated Robot Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <motion.div
              className="w-24 h-24 mx-auto rounded-2xl overflow-hidden"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(0, 255, 213, 0.3)",
                  "0 0 40px rgba(0, 255, 213, 0.5)",
                  "0 0 20px rgba(0, 255, 213, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/logo.png"
                alt="Reachy Mini"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SignalBadge variant="cyan" pulse className="mb-6">
              transmission active
            </SignalBadge>

            <h1 className="text-4xl sm:text-6xl md:text-8xl font-mono font-bold text-[var(--text-primary)] mb-6 tracking-tight">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                run
              </motion.span>
              <motion.span
                className="text-gradient-cyan"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                reachy
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                run
              </motion.span>
            </h1>

            <motion.p
              className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              Building a Reachy Mini Lite robot. Documenting every step — the
              wins, the failures, and the code in between.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <Link
                href="/timeline"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-mono font-medium rounded-lg hover:bg-[var(--accent-cyan-dim)] transition-all hover:scale-105"
              >
                Explore Timeline
                <span
                  aria-hidden="true"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  &rarr;
                </span>
              </Link>
              <Link
                href="/journal"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--border-default)] text-[var(--text-primary)] font-mono font-medium rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all hover:scale-105"
              >
                Read Journal
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-[var(--border-subtle)] flex items-start justify-center p-2"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]"
                animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
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
                      {formatDate(node.date, { month: "short", day: "numeric" })}
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
              This site documents my journey building apps and experiments with
              a{" "}
              <a
                href="https://www.pollen-robotics.com/reachy-mini/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-cyan)] hover:underline"
              >
                Reachy Mini Lite
              </a>{" "}
              robot. Every session, every breakthrough, every failure — captured
              as it happens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--accent-cyan-glow)] flex items-center justify-center">
                <Clock
                  className="text-[var(--accent-cyan)]"
                  size={24}
                  strokeWidth={1.5}
                />
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
                <BookOpen
                  className="text-[var(--accent-amber)]"
                  size={24}
                  strokeWidth={1.5}
                />
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
                <Bot
                  className="text-[var(--semantic-success)]"
                  size={24}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="font-mono font-medium text-[var(--text-primary)] mb-2">
                Apps
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Interactive demos and HuggingFace Spaces. Try what I've built.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Activity Section */}
      <section className="py-24 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <GitHubActivity />
          </motion.div>
        </div>
      </section>

      {/* Apps & Demos Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <AppsShowcase />
          </motion.div>
        </div>
      </section>

      {/* Claude Code Showcase Section */}
      <section className="py-24 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <ClaudeShowcase />
              </motion.div>
            </div>
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="p-6 sticky top-24">
                  <p className="font-mono text-sm text-[var(--text-muted)] mb-2">
                    from rundatarun.io
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                    I write about AI and data science at{" "}
                    <a
                      href="https://rundatarun.io"
                      className="text-[var(--accent-cyan)] hover:underline"
                    >
                      rundatarun.io
                    </a>
                    . This is the robotics spinoff — same voice, more servos.
                  </p>
                  <a
                    href="https://www.anthropic.com/claude-code"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-mono text-[var(--accent-amber)] hover:text-[var(--accent-amber-dim)] transition-colors"
                  >
                    Try Claude Code &rarr;
                  </a>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
