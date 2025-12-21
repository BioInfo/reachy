"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { SignalBadge } from "@/components/ui/signal-badge";
import type { GitHubActivityData } from "@/lib/github";

// Fallback data for when API is unavailable or during development
// Uses real commit SHAs from the repo
const fallbackData: GitHubActivityData = {
  commits: [
    {
      sha: "12849de",
      message: "chore: remove runreachyrun from tracking, update apps",
      date: "2024-12-21T12:00:00Z",
      url: "https://github.com/BioInfo/reachy/commit/12849de",
    },
    {
      sha: "8fdd83a",
      message: "Add runreachyrun.com documentation site",
      date: "2024-12-21T10:30:00Z",
      url: "https://github.com/BioInfo/reachy/commit/8fdd83a",
    },
    {
      sha: "459f32a",
      message: "Add DJ Reactor app and fix robot camera handling",
      date: "2024-12-20T15:45:00Z",
      url: "https://github.com/BioInfo/reachy/commit/459f32a",
    },
    {
      sha: "a397416",
      message: "Add Reachy Companion app roadmap and planning docs",
      date: "2024-12-19T09:20:00Z",
      url: "https://github.com/BioInfo/reachy/commit/a397416",
    },
  ],
  issues: [],
  lastFetched: new Date().toISOString(),
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export function GitHubActivity() {
  const [data, setData] = useState<GitHubActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/github");
        if (!response.ok) throw new Error("API error");
        const result = await response.json();

        // Use fallback if no real data
        if (result.commits.length === 0 && result.issues.length === 0) {
          setData(fallbackData);
          setUseFallback(true);
        } else {
          setData(result);
        }
      } catch {
        // Use fallback data on error
        setData(fallbackData);
        setUseFallback(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <GitHubActivitySkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SignalBadge variant="default">
            <span className="opacity-60">git</span> activity
          </SignalBadge>
          {useFallback && (
            <span className="font-mono text-xs text-[var(--text-muted)]">
              (demo data)
            </span>
          )}
        </div>
        <a
          href="https://github.com/BioInfo/reachy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-[var(--accent-cyan)] hover:underline"
        >
          view repo &rarr;
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Commits */}
        <Card className="p-5">
          <h3 className="font-mono text-sm text-[var(--text-muted)] mb-4 flex items-center gap-2">
            <span className="text-[var(--semantic-success)]">●</span>
            Recent Commits
          </h3>
          <div className="space-y-3">
            {data.commits.slice(0, 4).map((commit, index) => (
              <motion.a
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <code className="font-mono text-xs text-[var(--accent-cyan)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded shrink-0">
                    {commit.sha.slice(0, 7)}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors truncate">
                      {commit.message}
                    </p>
                    <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
                      {formatRelativeTime(commit.date)}
                    </p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </Card>

        {/* Open Issues */}
        <Card className="p-5">
          <h3 className="font-mono text-sm text-[var(--text-muted)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-amber)]">○</span>
            Open Issues
          </h3>
          <div className="space-y-3">
            {data.issues.filter((i) => i.state === "open").length > 0 ? (
              data.issues
                .filter((i) => i.state === "open")
                .slice(0, 4)
                .map((issue, index) => (
                  <motion.a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      <code className="font-mono text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded shrink-0">
                        #{issue.number}
                      </code>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors truncate">
                          {issue.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {issue.labels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="font-mono text-xs text-[var(--text-muted)]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.a>
                ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] italic">
                No open issues
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GitHubActivitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-6 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-5 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse mt-1" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-5 w-12 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
