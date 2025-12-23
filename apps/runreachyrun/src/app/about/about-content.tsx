"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";

export function AboutContent() {
  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-mono font-bold text-[var(--text-primary)]">
            About
          </h1>
          <SignalBadge variant="cyan">the human</SignalBadge>
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="prose-custom"
      >
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] overflow-hidden">
              <Image
                src="/justin.jpg"
                alt="Justin Johnson"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium text-[var(--text-primary)] mb-3 mt-0">
              Justin Johnson
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Executive Director of Oncology Data Science at AstraZeneca. I spend my days building
              AI/ML systems for cancer research and my nights building robots with Claude Code.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Background in genomics, computational biology, and data platforms. I build things to
              understand them, not just to ship them.
            </p>
          </div>
        </div>

        {/* What is this site */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
            What is runreachyrun?
          </h3>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            This site documents the journey of building with a{" "}
            <a
              href="https://www.pollen-robotics.com/reachy-mini/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-cyan)] hover:underline"
            >
              Reachy Mini Lite
            </a>
            {" "}— a small expressive robot from Pollen Robotics. But the meta-story matters too:
            I&apos;m building the robot, building this website, and writing the content all with{" "}
            <a
              href="https://claude.ai/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-cyan)] hover:underline"
            >
              Claude Code
            </a>
            {" "}as my pair programmer.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The recursive collaboration between human and AI is visible throughout — from the
            debugging sessions to the code commits to this very paragraph.
          </p>
        </Card>

        {/* Why build in public */}
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
          Why build in public?
        </h3>
        <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
          Because the process is often more interesting than the result. Debugging journeys,
          architectural decisions, dead ends — that&apos;s where the real learning happens.
          Polished tutorials hide the mess. I want to show the mess.
        </p>

        {/* The stack */}
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3 mt-8">
          The stack
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-xs font-mono text-[var(--text-muted)] mb-1">Robot</p>
            <p className="text-[var(--text-primary)]">Reachy Mini Lite</p>
          </div>
          <div>
            <p className="text-xs font-mono text-[var(--text-muted)] mb-1">AI Pair Programmer</p>
            <p className="text-[var(--text-primary)]">Claude Code (Opus)</p>
          </div>
          <div>
            <p className="text-xs font-mono text-[var(--text-muted)] mb-1">Website</p>
            <p className="text-[var(--text-primary)]">Next.js + Tailwind + Framer</p>
          </div>
          <div>
            <p className="text-xs font-mono text-[var(--text-muted)] mb-1">Hosting</p>
            <p className="text-[var(--text-primary)]">Vercel</p>
          </div>
        </div>

        {/* Links */}
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3 mt-8">
          Find me elsewhere
        </h3>
        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href="https://rundatarun.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            rundatarun.io
            <span className="text-[var(--text-muted)]">→</span>
          </a>
          <a
            href="https://github.com/BioInfo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            GitHub
            <span className="text-[var(--text-muted)]">→</span>
          </a>
          <a
            href="https://twitter.com/bioinfo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            X / Twitter
            <span className="text-[var(--text-muted)]">→</span>
          </a>
          <a
            href="https://bsky.app/profile/justinhjohnson.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            Bluesky
            <span className="text-[var(--text-muted)]">→</span>
          </a>
          <a
            href="https://www.linkedin.com/in/justinhaywardjohnson/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            LinkedIn
            <span className="text-[var(--text-muted)]">→</span>
          </a>
        </div>

        {/* Back link */}
        <div className="pt-8 border-t border-[var(--border-subtle)]">
          <Link
            href="/"
            className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm transition-colors"
          >
            &larr; back to home
          </Link>
        </div>
      </motion.div>
    </>
  );
}
