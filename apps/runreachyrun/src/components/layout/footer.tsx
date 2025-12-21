"use client";

import { SignalLine } from "@/components/ui/signal-line";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-mono text-lg font-medium text-[var(--text-primary)] mb-3">
              runreachyrun
            </h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Documenting the journey of building a Reachy Mini Lite robot.
              Hardware, software, and everything in between.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/timeline"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  Build Timeline
                </a>
              </li>
              <li>
                <a
                  href="/journal"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  Dev Journal
                </a>
              </li>
              <li>
                <a
                  href="/apps"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  Apps
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* External */}
          <div>
            <h4 className="font-mono text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/BioInfo/reachy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://rundatarun.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  rundatarun.io
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/bioinfo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://huggingface.co/RyeCatcher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm"
                >
                  Hugging Face
                </a>
              </li>
            </ul>
          </div>
        </div>

        <SignalLine className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
          <p>&copy; {currentYear} Justin Johnson. All rights reserved.</p>
          <p className="font-mono text-xs">
            Built with Next.js, Tailwind, and{" "}
            <span className="text-[var(--accent-cyan)]">Claude Code</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
