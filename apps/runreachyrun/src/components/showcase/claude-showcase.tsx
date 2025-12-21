"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { SignalBadge } from "@/components/ui/signal-badge";

interface ClaudeContribution {
  id: string;
  title: string;
  category: "code" | "content" | "design" | "debugging";
  description: string;
  snippet?: {
    language: string;
    code: string;
    file?: string;
  };
  prompt?: string;
}

const contributions: ClaudeContribution[] = [
  {
    id: "timeline-component",
    title: "Timeline Component Architecture",
    category: "code",
    description:
      "Designed the expandable timeline node system with filtering, media grids, and bidirectional linking to journal entries.",
    snippet: {
      language: "tsx",
      file: "timeline-node.tsx",
      code: `// Expandable timeline node with Claude snippet display
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      {node.claudeSnippet && (
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <SignalBadge variant="amber">claude</SignalBadge>
          <p className="text-sm italic">{node.claudeSnippet}</p>
        </div>
      )}
    </motion.div>
  )}
</AnimatePresence>`,
    },
    prompt:
      "Build a timeline component with expandable nodes that can show Claude contributions inline",
  },
  {
    id: "github-api",
    title: "GitHub API Integration",
    category: "code",
    description:
      "Built the API layer with rate limiting awareness, caching, and graceful fallbacks when the API is unavailable.",
    snippet: {
      language: "typescript",
      file: "lib/github.ts",
      code: `// Fetch with fallback to static data
export async function getGitHubActivity(): Promise<GitHubData> {
  try {
    const [commits, stats] = await Promise.all([
      fetchRecentCommits(),
      fetchRepoStats(),
    ]);
    return { commits, stats, isLive: true };
  } catch (error) {
    console.warn("GitHub API unavailable, using fallback");
    return { ...FALLBACK_DATA, isLive: false };
  }
}`,
    },
  },
  {
    id: "journal-markdown",
    title: "Safe Markdown Parser",
    category: "debugging",
    description:
      "Created a React-safe markdown parser that handles code blocks, lists, and blockquotes using React elements instead of raw HTML.",
    snippet: {
      language: "tsx",
      file: "journal/[slug]/page.tsx",
      code: `// Parse markdown to React elements safely
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\\n");
  const elements: React.ReactNode[] = [];

  // Handle code blocks, lists, blockquotes
  // Returns array of React elements
  return elements;
}`,
    },
    prompt: "Parse markdown using React elements for safety",
  },
  {
    id: "design-system",
    title: "Signal-Inspired Design System",
    category: "design",
    description:
      "Developed the visual language: signal badges, animated lines, the cyan/amber/success color system, and dark-first approach.",
  },
];

const categoryColors: Record<string, "cyan" | "amber" | "success" | "failure" | "default"> =
  {
    code: "cyan",
    content: "amber",
    design: "success",
    debugging: "failure",
  };

function ContributionCard({ contribution }: { contribution: ClaudeContribution }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card variant="interactive" className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SignalBadge variant={categoryColors[contribution.category]}>
                {contribution.category}
              </SignalBadge>
            </div>
            <h4 className="font-medium text-[var(--text-primary)] mb-1">
              {contribution.title}
            </h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {contribution.description}
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
        {isExpanded && contribution.snippet && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--border-subtle)]"
          >
            <div className="p-5 pt-4">
              {contribution.prompt && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--bg-tertiary)] border-l-2 border-[var(--accent-amber)]">
                  <p className="text-xs font-mono text-[var(--text-muted)] mb-1">
                    prompt
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] italic">
                    "{contribution.prompt}"
                  </p>
                </div>
              )}
              <div className="relative">
                {contribution.snippet.file && (
                  <p className="text-xs font-mono text-[var(--text-muted)] mb-2">
                    {contribution.snippet.file}
                  </p>
                )}
                <pre className="p-4 rounded-lg bg-[var(--bg-tertiary)] overflow-x-auto">
                  <code className="text-sm font-mono text-[var(--text-secondary)]">
                    {contribution.snippet.code}
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function ClaudeShowcase() {
  const [showAll, setShowAll] = useState(false);
  const displayedContributions = showAll
    ? contributions
    : contributions.slice(0, 2);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <SignalBadge variant="amber" pulse>
          meta
        </SignalBadge>
        <h3 className="text-lg font-mono font-medium text-[var(--text-primary)]">
          Built with Claude Code
        </h3>
      </div>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-6 max-w-2xl">
        This site is a collaboration. Here are some examples of how Claude
        contributed — not as a gimmick, but as honest documentation of how this
        project gets made.
      </p>

      <div className="space-y-4">
        {displayedContributions.map((contribution) => (
          <ContributionCard key={contribution.id} contribution={contribution} />
        ))}
      </div>

      {contributions.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 w-full py-3 px-4 rounded-lg border border-[var(--border-default)] text-sm font-mono text-[var(--text-secondary)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
        >
          {showAll
            ? "show less"
            : `show ${contributions.length - 2} more contributions`}
        </button>
      )}
    </div>
  );
}
