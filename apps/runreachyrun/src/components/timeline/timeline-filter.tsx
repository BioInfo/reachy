"use client";

import { motion } from "framer-motion";
import type { TimelineNode } from "@/types";

type FilterType = TimelineNode["type"] | "all";

interface TimelineFilterProps {
  activeType: FilterType;
  activeTag: string | null;
  availableTags: string[];
  onTypeChange: (type: FilterType) => void;
  onTagChange: (tag: string | null) => void;
  counts: Record<FilterType, number>;
}

const typeLabels: Record<FilterType, string> = {
  all: "All",
  milestone: "Milestones",
  breakthrough: "Breakthroughs",
  failure: "Failures",
  session: "Sessions",
  blog: "Blog",
};

const typeColors: Record<FilterType, string> = {
  all: "text-[var(--text-primary)] border-[var(--text-primary)]",
  milestone: "text-[var(--accent-cyan)] border-[var(--accent-cyan)]",
  breakthrough: "text-[var(--semantic-success)] border-[var(--semantic-success)]",
  failure: "text-[var(--semantic-failure)] border-[var(--semantic-failure)]",
  session: "text-[var(--text-secondary)] border-[var(--text-secondary)]",
  blog: "text-[var(--accent-amber)] border-[var(--accent-amber)]",
};

export function TimelineFilter({
  activeType,
  activeTag,
  availableTags,
  onTypeChange,
  onTagChange,
  counts,
}: TimelineFilterProps) {
  const types: FilterType[] = [
    "all",
    "milestone",
    "breakthrough",
    "session",
    "failure",
    "blog",
  ];

  return (
    <div className="space-y-4">
      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <motion.button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`
              px-3 py-1.5 rounded-full border font-mono text-xs
              transition-all duration-200
              ${
                activeType === type
                  ? `${typeColors[type]} bg-[var(--bg-tertiary)]`
                  : "text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {typeLabels[type]}
            <span className="ml-1.5 opacity-60">{counts[type]}</span>
          </motion.button>
        ))}
      </div>

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-[var(--text-muted)]">tags:</span>
          {activeTag && (
            <motion.button
              onClick={() => onTagChange(null)}
              className="px-2 py-1 rounded border border-[var(--accent-cyan)] bg-[var(--accent-cyan-glow)] text-[var(--accent-cyan)] font-mono text-xs flex items-center gap-1"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              #{activeTag}
              <span className="opacity-60">×</span>
            </motion.button>
          )}
          {!activeTag && (
            <div className="flex flex-wrap gap-1">
              {availableTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagChange(tag)}
                  className="px-2 py-1 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                >
                  #{tag}
                </button>
              ))}
              {availableTags.length > 8 && (
                <span className="px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
                  +{availableTags.length - 8} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
