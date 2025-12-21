"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SignalBadge } from "@/components/ui/signal-badge";
import { TimelineNode } from "@/components/timeline/timeline-node";
import { TimelineFilter } from "@/components/timeline/timeline-filter";
import type { TimelineNode as TimelineNodeType } from "@/types";

type FilterType = TimelineNodeType["type"] | "all";

interface TimelineContentProps {
  nodes: TimelineNodeType[];
  availableTags: string[];
}

export function TimelineContent({ nodes, availableTags }: TimelineContentProps) {
  const [activeType, setActiveType] = useState<FilterType>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    let filtered = nodes;

    if (activeType !== "all") {
      filtered = filtered.filter((node) => node.type === activeType);
    }

    if (activeTag) {
      filtered = filtered.filter((node) => node.tags.includes(activeTag));
    }

    return filtered;
  }, [nodes, activeType, activeTag]);

  // Count by type
  const counts = useMemo(() => {
    const base: Record<FilterType, number> = {
      all: nodes.length,
      milestone: 0,
      breakthrough: 0,
      failure: 0,
      session: 0,
      blog: 0,
    };

    nodes.forEach((node) => {
      base[node.type]++;
    });

    return base;
  }, [nodes]);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <SignalBadge variant="cyan" pulse className="mb-4">
          build log
        </SignalBadge>

        <h1 className="text-3xl md:text-4xl font-mono font-bold text-[var(--text-primary)] mb-4">
          Timeline
        </h1>

        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          Every milestone, breakthrough, and failure — documented as it happens.
          Click on nodes to see Claude Code conversations, media, and commit
          details.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 pb-8 border-b border-[var(--border-subtle)]"
      >
        <TimelineFilter
          activeType={activeType}
          activeTag={activeTag}
          availableTags={availableTags}
          onTypeChange={setActiveType}
          onTagChange={setActiveTag}
          counts={counts}
        />
      </motion.div>

      {/* Results count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="font-mono text-sm text-[var(--text-muted)] mb-8"
      >
        showing {filteredNodes.length} of {nodes.length} entries
        {activeTag && (
          <span className="text-[var(--accent-cyan)]"> tagged #{activeTag}</span>
        )}
      </motion.p>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {filteredNodes.length > 0 ? (
          <div className="relative">
            {filteredNodes.map((node, index) => (
              <TimelineNode
                key={node.id}
                node={node}
                isFirst={index === 0}
                isLast={index === filteredNodes.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)] font-mono">
              No entries match your filters.
            </p>
            <button
              onClick={() => {
                setActiveType("all");
                setActiveTag(null);
              }}
              className="mt-4 text-[var(--accent-cyan)] hover:underline font-mono text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-16 pt-8 border-t border-[var(--border-subtle)] text-center"
      >
        <p className="text-[var(--text-secondary)] mb-4">
          Want the raw, unfiltered session notes?
        </p>
        <a
          href="/journal"
          className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
        >
          Read the Journal &rarr;
        </a>
      </motion.div>
    </>
  );
}
