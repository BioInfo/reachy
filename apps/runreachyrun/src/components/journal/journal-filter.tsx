"use client";

import { motion } from "framer-motion";
import type { JournalEntry } from "@/types";

type MoodFilter = JournalEntry["mood"] | "all";

interface JournalFilterProps {
  activeMood: MoodFilter;
  activeTag: string | null;
  availableTags: string[];
  onMoodChange: (mood: MoodFilter) => void;
  onTagChange: (tag: string | null) => void;
}

const moodOptions: { value: MoodFilter; label: string; color: string }[] = [
  { value: "all", label: "All", color: "text-[var(--text-primary)]" },
  { value: "win", label: "Wins", color: "text-[var(--semantic-success)]" },
  { value: "excited", label: "Excited", color: "text-[var(--accent-cyan)]" },
  { value: "struggle", label: "Struggles", color: "text-[var(--semantic-failure)]" },
  { value: "neutral", label: "Neutral", color: "text-[var(--text-secondary)]" },
];

export function JournalFilter({
  activeMood,
  activeTag,
  availableTags,
  onMoodChange,
  onTagChange,
}: JournalFilterProps) {
  return (
    <div className="space-y-4">
      {/* Mood filters */}
      <div className="flex flex-wrap gap-2">
        {moodOptions.map((option) => (
          <motion.button
            key={option.value ?? "all"}
            onClick={() => onMoodChange(option.value)}
            className={`
              px-3 py-1.5 rounded-full border font-mono text-xs
              transition-all duration-200
              ${
                activeMood === option.value
                  ? `${option.color} border-current bg-[var(--bg-tertiary)]`
                  : "text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {option.label}
          </motion.button>
        ))}
      </div>

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-[var(--text-muted)]">tags:</span>
          {activeTag ? (
            <motion.button
              onClick={() => onTagChange(null)}
              className="px-2 py-1 rounded border border-[var(--accent-cyan)] bg-[var(--accent-cyan-glow)] text-[var(--accent-cyan)] font-mono text-xs flex items-center gap-1"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              #{activeTag}
              <span className="opacity-60">x</span>
            </motion.button>
          ) : (
            <div className="flex flex-wrap gap-1">
              {availableTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagChange(tag)}
                  className="px-2 py-1 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                >
                  #{tag}
                </button>
              ))}
              {availableTags.length > 10 && (
                <span className="px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
                  +{availableTags.length - 10} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
