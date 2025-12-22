"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { loadEmbeddings, hybridSearch } from "@/lib/rag/vector-search";
import type { EmbeddingDocument, EmbeddingsData } from "@/lib/rag/types";
import type { TimelineNode, JournalEntry } from "@/types";

interface SearchResult {
  type: "timeline" | "journal" | "blog" | "claude" | "app" | "claude-session";
  id: string;
  title: string;
  summary: string;
  date: string;
  href: string;
  matches: string[];
  score: number;
  matchType?: "keyword" | "semantic" | "hybrid";
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timelineNodes: TimelineNode[];
  journalEntries: JournalEntry[];
}

export function SearchDialog({
  isOpen,
  onClose,
  timelineNodes,
  journalEntries,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [embeddingsData, setEmbeddingsData] = useState<EmbeddingsData | null>(null);
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);
  const [isLoadingEmbeddings, setIsLoadingEmbeddings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load embeddings on mount
  useEffect(() => {
    if (isOpen && !embeddingsData && useSemanticSearch) {
      setIsLoadingEmbeddings(true);
      loadEmbeddings()
        .then((data) => setEmbeddingsData(data))
        .catch((err) => {
          console.warn("Failed to load embeddings, falling back to keyword search:", err);
          setUseSemanticSearch(false);
        })
        .finally(() => setIsLoadingEmbeddings(false));
    }
  }, [isOpen, embeddingsData, useSemanticSearch]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search function with semantic support
  const search = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      // If we have embeddings, use hybrid search
      if (embeddingsData && useSemanticSearch) {
        const semanticResults = hybridSearch(
          searchQuery,
          embeddingsData.documents,
          10
        );

        const mappedResults: SearchResult[] = semanticResults.map((r) => ({
          type: mapType(r.document.type),
          id: r.document.id,
          title: r.document.title,
          summary: r.document.content.slice(0, 200),
          date: r.document.metadata.date || "",
          href: getHref(r.document),
          matches: [],
          score: r.score,
          matchType: r.matchType,
        }));

        setResults(mappedResults);
        setSelectedIndex(0);
        return;
      }

      // Fallback to legacy keyword search
      const lowerQuery = searchQuery.toLowerCase();
      const terms = lowerQuery.split(/\s+/).filter(Boolean);
      const searchResults: SearchResult[] = [];

      // Search timeline nodes
      for (const node of timelineNodes) {
        const searchableText = [
          node.title,
          node.summary,
          node.tags.join(" "),
          node.type,
          node.content?.journal || "",
          node.content?.claudeSnippet?.prompt || "",
          node.content?.claudeSnippet?.response || "",
        ]
          .join(" ")
          .toLowerCase();

        const matches: string[] = [];
        let score = 0;

        for (const term of terms) {
          if (searchableText.includes(term)) {
            score += 1;
            const idx = searchableText.indexOf(term);
            const start = Math.max(0, idx - 30);
            const end = Math.min(searchableText.length, idx + term.length + 30);
            const context = searchableText.slice(start, end);
            matches.push(`...${context}...`);
          }
        }

        if (node.title.toLowerCase().includes(lowerQuery)) {
          score += 5;
        }

        if (score > 0) {
          searchResults.push({
            type: "timeline",
            id: node.id,
            title: node.title,
            summary: node.summary,
            date: node.date,
            href: `/timeline#${node.id}`,
            matches: matches.slice(0, 2),
            score,
          });
        }
      }

      // Search journal entries
      for (const entry of journalEntries) {
        const searchableText = [
          entry.title,
          entry.summary,
          entry.content,
          entry.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        const matches: string[] = [];
        let score = 0;

        for (const term of terms) {
          if (searchableText.includes(term)) {
            score += 1;
            const idx = searchableText.indexOf(term);
            const start = Math.max(0, idx - 30);
            const end = Math.min(searchableText.length, idx + term.length + 30);
            const context = searchableText.slice(start, end);
            matches.push(`...${context}...`);
          }
        }

        if (entry.title.toLowerCase().includes(lowerQuery)) {
          score += 5;
        }

        if (score > 0) {
          searchResults.push({
            type: "journal",
            id: entry.slug,
            title: entry.title,
            summary: entry.summary,
            date: entry.date,
            href: `/journal/${entry.slug}`,
            matches: matches.slice(0, 2),
            score,
          });
        }
      }

      searchResults.sort((a, b) => b.score - a.score);
      setResults(searchResults.slice(0, 10));
      setSelectedIndex(0);
    },
    [timelineNodes, journalEntries, embeddingsData, useSemanticSearch]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          window.location.href = results[selectedIndex].href;
          onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  const typeIcons: Record<string, string> = {
    timeline: "Clock",
    journal: "BookOpen",
    blog: "FileText",
    claude: "Bot",
    "claude-session": "Bot",
    app: "Cpu",
  };

  const typeColors: Record<string, "cyan" | "amber" | "success" | "default"> = {
    timeline: "cyan",
    journal: "amber",
    blog: "success",
    claude: "default",
    "claude-session": "default",
    app: "cyan",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <Card className="overflow-hidden shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
                <Icon
                  name="Search"
                  size={20}
                  className="text-[var(--text-muted)]"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isLoadingEmbeddings
                      ? "Loading semantic search..."
                      : "Search timeline, journal, apps, and more..."
                  }
                  className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none font-mono text-sm"
                  disabled={isLoadingEmbeddings}
                />
                {embeddingsData && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] rounded">
                    AI
                  </span>
                )}
                <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-mono rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {query && results.length === 0 && !isLoadingEmbeddings && (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    <p className="font-mono text-sm">No results for &quot;{query}&quot;</p>
                    <p className="text-xs mt-2">
                      Try different keywords or check spelling
                    </p>
                  </div>
                )}

                {results.map((result, index) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    onClick={onClose}
                    className={`block p-4 border-b border-[var(--border-subtle)] transition-colors ${
                      index === selectedIndex
                        ? "bg-[var(--bg-tertiary)]"
                        : "hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-[var(--text-muted)]">
                        <Icon name={typeIcons[result.type] || "File"} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SignalBadge variant={typeColors[result.type] || "default"}>
                            {result.type === "claude-session" ? "claude" : result.type}
                          </SignalBadge>
                          {result.date && (
                            <span className="text-xs text-[var(--text-muted)] font-mono">
                              {new Date(result.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                          {result.matchType && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono opacity-50">
                              {result.matchType}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-[var(--text-primary)] truncate">
                          {result.title}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                          {result.summary}
                        </p>
                        {result.matches.length > 0 && (
                          <p className="text-xs text-[var(--text-muted)] mt-1 truncate font-mono">
                            {result.matches[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                {!query && (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    <p className="font-mono text-sm">Start typing to search</p>
                    <div className="flex justify-center gap-4 mt-4 text-xs">
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">
                          ↑↓
                        </kbd>{" "}
                        navigate
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">
                          ↵
                        </kbd>{" "}
                        select
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">
                          esc
                        </kbd>{" "}
                        close
                      </span>
                    </div>
                    {embeddingsData && (
                      <p className="mt-4 text-[10px] text-[var(--accent-cyan)]">
                        Semantic search enabled — understands meaning, not just keywords
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function mapType(type: EmbeddingDocument["type"]): SearchResult["type"] {
  if (type === "claude-session") return "claude-session";
  return type as SearchResult["type"];
}

function getHref(doc: EmbeddingDocument): string {
  const slug = doc.metadata.slug || doc.id.replace(`${doc.type}-`, "");
  switch (doc.type) {
    case "journal":
      return `/journal/${slug}`;
    case "blog":
      return `/blog/${slug}`;
    case "timeline":
      return `/timeline#${slug}`;
    case "app":
      return `/apps/${slug}`;
    case "claude-session":
      return `/claude#${slug}`;
    default:
      return "/";
  }
}
