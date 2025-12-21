"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SignalBadge } from "@/components/ui/signal-badge";
import { JournalCard } from "@/components/journal/journal-card";
import { JournalFilter } from "@/components/journal/journal-filter";
import type { JournalEntry } from "@/types";

type MoodFilter = JournalEntry["mood"] | "all";

interface JournalContentProps {
  entries: JournalEntry[];
  availableTags: string[];
}

export function JournalContent({ entries, availableTags }: JournalContentProps) {
  const [activeMood, setActiveMood] = useState<MoodFilter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (activeMood !== "all") {
      filtered = filtered.filter((entry) => entry.mood === activeMood);
    }

    if (activeTag) {
      filtered = filtered.filter((entry) => entry.tags.includes(activeTag));
    }

    return filtered;
  }, [entries, activeMood, activeTag]);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <SignalBadge variant="amber" pulse className="mb-4">
          raw notes
        </SignalBadge>

        <h1 className="text-3xl md:text-4xl font-mono font-bold text-[var(--text-primary)] mb-4">
          Dev Journal
        </h1>

        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          Unfiltered session notes. The wins, the struggles, and everything in
          between. This is what building actually looks like.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 pb-8 border-b border-[var(--border-subtle)]"
      >
        <JournalFilter
          activeMood={activeMood}
          activeTag={activeTag}
          availableTags={availableTags}
          onMoodChange={setActiveMood}
          onTagChange={setActiveTag}
        />
      </motion.div>

      {/* Results count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="font-mono text-sm text-[var(--text-muted)] mb-8"
      >
        {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
        {activeTag && (
          <span className="text-[var(--accent-cyan)]"> tagged #{activeTag}</span>
        )}
      </motion.p>

      {/* Entries grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEntries.map((entry, index) => (
              <JournalCard key={entry.slug} entry={entry} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)] font-mono">
              No entries match your filters.
            </p>
            <button
              onClick={() => {
                setActiveMood("all");
                setActiveTag(null);
              }}
              className="mt-4 text-[var(--accent-cyan)] hover:underline font-mono text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-16 pt-8 border-t border-[var(--border-subtle)]"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              {entries.length}
            </p>
            <p className="text-sm text-[var(--text-muted)]">total entries</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-[var(--semantic-success)]">
              {entries.filter((e) => e.mood === "win").length}
            </p>
            <p className="text-sm text-[var(--text-muted)]">wins</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-[var(--semantic-failure)]">
              {entries.filter((e) => e.mood === "struggle").length}
            </p>
            <p className="text-sm text-[var(--text-muted)]">struggles</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-[var(--text-secondary)]">
              {entries.reduce((sum, e) => sum + (e.readingTime || 0), 0)}
            </p>
            <p className="text-sm text-[var(--text-muted)]">min to read all</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
