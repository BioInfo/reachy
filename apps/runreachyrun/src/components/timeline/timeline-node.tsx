"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignalBadge } from "@/components/ui/signal-badge";
import { formatDate } from "@/lib/date";
import type { TimelineNode as TimelineNodeType } from "@/types";

type BadgeVariant = "cyan" | "amber" | "success" | "failure" | "default";

const typeColors: Record<TimelineNodeType["type"], BadgeVariant> = {
  milestone: "cyan",
  breakthrough: "success",
  failure: "failure",
  session: "default",
  blog: "amber",
};

const typeIcons: Record<TimelineNodeType["type"], string> = {
  milestone: "◆",
  breakthrough: "★",
  failure: "✕",
  session: "●",
  blog: "◇",
};

interface TimelineNodeProps {
  node: TimelineNodeType;
  isFirst?: boolean;
  isLast?: boolean;
}

export function TimelineNode({ node, isFirst, isLast }: TimelineNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExpandableContent =
    node.content?.claudeSnippet ||
    node.content?.media?.length ||
    node.content?.commits?.length;

  const formattedDate = formatDate(node.date);

  return (
    <div className="relative flex gap-6">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        {/* Connector line (top) */}
        {!isFirst && (
          <div className="w-px h-6 bg-gradient-to-b from-[var(--border-subtle)] to-[var(--border-default)]" />
        )}
        {isFirst && <div className="h-6" />}

        {/* Node marker */}
        <motion.button
          onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
          className={`
            relative z-10 w-10 h-10 rounded-full border-2
            flex items-center justify-center font-mono text-sm
            transition-all duration-200
            ${
              typeColors[node.type] === "cyan"
                ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan-glow)]"
                : ""
            }
            ${
              typeColors[node.type] === "success"
                ? "border-[var(--semantic-success)] text-[var(--semantic-success)] bg-[rgba(74,222,128,0.1)]"
                : ""
            }
            ${
              typeColors[node.type] === "failure"
                ? "border-[var(--semantic-failure)] text-[var(--semantic-failure)] bg-[rgba(255,107,107,0.1)]"
                : ""
            }
            ${
              typeColors[node.type] === "amber"
                ? "border-[var(--accent-amber)] text-[var(--accent-amber)] bg-[var(--accent-amber-glow)]"
                : ""
            }
            ${
              typeColors[node.type] === "default"
                ? "border-[var(--border-default)] text-[var(--text-muted)] bg-[var(--bg-tertiary)]"
                : ""
            }
            ${hasExpandableContent ? "cursor-pointer hover:scale-110" : ""}
          `}
          whileHover={hasExpandableContent ? { scale: 1.1 } : undefined}
          whileTap={hasExpandableContent ? { scale: 0.95 } : undefined}
          aria-expanded={isExpanded}
          aria-label={hasExpandableContent ? `Expand ${node.title}` : node.title}
        >
          {typeIcons[node.type]}
        </motion.button>

        {/* Connector line (bottom) */}
        {!isLast && (
          <div className="w-px flex-1 min-h-[60px] bg-gradient-to-b from-[var(--border-default)] to-[var(--border-subtle)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {formattedDate}
            </span>
            <SignalBadge variant={typeColors[node.type]}>{node.type}</SignalBadge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            {node.title}
          </h3>

          {/* Summary */}
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            {node.summary}
          </p>

          {/* Tags */}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Expand indicator */}
          {hasExpandableContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-mono text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] transition-colors flex items-center gap-1"
            >
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▶
              </motion.span>
              {isExpanded ? "collapse" : "expand"}
            </button>
          )}
        </motion.div>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && hasExpandableContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                {/* Claude Snippet */}
                {node.content?.claudeSnippet && (
                  <ClaudeSnippetDisplay snippet={node.content.claudeSnippet} />
                )}

                {/* Media */}
                {node.content?.media && node.content.media.length > 0 && (
                  <MediaDisplay media={node.content.media} />
                )}

                {/* Commits */}
                {node.content?.commits && node.content.commits.length > 0 && (
                  <CommitsDisplay commits={node.content.commits} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Claude Snippet sub-component
function ClaudeSnippetDisplay({
  snippet,
}: {
  snippet: NonNullable<TimelineNodeType["content"]>["claudeSnippet"];
}) {
  if (!snippet) return null;

  return (
    <div className="rounded-lg border border-[var(--accent-amber-glow)] bg-[var(--bg-tertiary)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--accent-amber-glow)] bg-[var(--accent-amber-glow)]">
        <span className="font-mono text-xs text-[var(--accent-amber)]">
          claude code session
        </span>
        {snippet.context && (
          <span className="text-xs text-[var(--text-muted)] ml-2">
            — {snippet.context}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <span className="font-mono text-xs text-[var(--text-muted)] block mb-1">
            prompt:
          </span>
          <p className="text-sm text-[var(--text-primary)] pl-3 border-l-2 border-[var(--accent-cyan)]">
            {snippet.prompt}
          </p>
        </div>
        <div>
          <span className="font-mono text-xs text-[var(--text-muted)] block mb-1">
            response:
          </span>
          <p className="text-sm text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--accent-amber)]">
            {snippet.response}
          </p>
        </div>
      </div>
    </div>
  );
}

// Media sub-component
function MediaDisplay({
  media,
}: {
  media: NonNullable<TimelineNodeType["content"]>["media"];
}) {
  if (!media || media.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {media.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)]"
        >
          {item.type === "image" && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt || "Timeline media"}
                className="w-full h-48 object-cover"
              />
              {item.caption && (
                <p className="p-3 text-xs text-[var(--text-muted)]">
                  {item.caption}
                </p>
              )}
            </>
          )}
          {item.type === "video" && (
            <video
              src={item.src}
              controls
              className="w-full"
              aria-label={item.alt || "Timeline video"}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Commits sub-component
function CommitsDisplay({ commits }: { commits: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="font-mono text-xs text-[var(--text-muted)]">commits:</span>
      {commits.map((sha) => (
        <a
          key={sha}
          href={`https://github.com/BioInfo/reachy/commit/${sha}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-[var(--accent-cyan)] hover:underline"
        >
          {sha.slice(0, 7)}
        </a>
      ))}
    </div>
  );
}
