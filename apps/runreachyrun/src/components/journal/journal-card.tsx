"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import type { JournalEntry } from "@/types";

type BadgeVariant = "cyan" | "amber" | "success" | "failure" | "default";

const moodConfig: Record<
  NonNullable<JournalEntry["mood"]>,
  { variant: BadgeVariant; label: string; icon: string }
> = {
  win: { variant: "success", label: "win", icon: "+" },
  struggle: { variant: "failure", label: "struggle", icon: "~" },
  neutral: { variant: "default", label: "neutral", icon: "=" },
  excited: { variant: "cyan", label: "excited", icon: "!" },
};

interface JournalCardProps {
  entry: JournalEntry;
  index?: number;
}

export function JournalCard({ entry, index = 0 }: JournalCardProps) {
  const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const mood = entry.mood ? moodConfig[entry.mood] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/journal/${entry.slug}`}>
        <Card variant="interactive" className="p-6 h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {formattedDate}
              </span>
              {mood && (
                <SignalBadge variant={mood.variant}>
                  <span className="opacity-60">{mood.icon}</span> {mood.label}
                </SignalBadge>
              )}
            </div>
            {entry.readingTime && (
              <span className="font-mono text-xs text-[var(--text-muted)] whitespace-nowrap">
                {entry.readingTime} min
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
            {entry.title}
          </h3>

          {/* Summary */}
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 line-clamp-2">
            {entry.summary}
          </p>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs text-[var(--text-muted)]"
                >
                  #{tag}
                </span>
              ))}
              {entry.tags.length > 4 && (
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  +{entry.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Timeline link indicator */}
          {entry.linkedTimeline && entry.linkedTimeline.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <span className="font-mono text-xs text-[var(--accent-cyan)]">
                linked to timeline
              </span>
            </div>
          )}
        </Card>
      </Link>
    </motion.div>
  );
}
