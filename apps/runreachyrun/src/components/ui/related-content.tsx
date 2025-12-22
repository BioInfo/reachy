"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { SignalBadge } from "@/components/ui/signal-badge";
import { getRelatedDocuments } from "@/lib/rag/vector-search";
import type { EmbeddingDocument } from "@/lib/rag/types";

interface RelatedContentProps {
  currentId: string;
  limit?: number;
  className?: string;
}

type RelatedDocument = Omit<EmbeddingDocument, "embedding">;

export function RelatedContent({
  currentId,
  limit = 3,
  className = "",
}: RelatedContentProps) {
  const [related, setRelated] = useState<RelatedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getRelatedDocuments(currentId, limit)
      .then((docs) => setRelated(docs))
      .catch((err) => {
        console.warn("Failed to load related content:", err);
        setRelated([]);
      })
      .finally(() => setIsLoading(false));
  }, [currentId, limit]);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Sparkles" size={18} className="text-[var(--accent-cyan)]" />
          <h3 className="font-mono text-sm font-medium text-[var(--text-primary)]">
            Related Content
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-[var(--bg-secondary)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  const typeIcons: Record<string, string> = {
    timeline: "Clock",
    journal: "BookOpen",
    blog: "FileText",
    "claude-session": "Bot",
    app: "Cpu",
  };

  const typeColors: Record<string, "cyan" | "amber" | "success" | "default"> = {
    timeline: "cyan",
    journal: "amber",
    blog: "success",
    "claude-session": "default",
    app: "cyan",
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Sparkles" size={18} className="text-[var(--accent-cyan)]" />
        <h3 className="font-mono text-sm font-medium text-[var(--text-primary)]">
          Related Content
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {related.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={getHref(doc)}
              className="block p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-cyan)] transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  name={typeIcons[doc.type] || "File"}
                  size={14}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors"
                />
                <SignalBadge variant={typeColors[doc.type] || "default"}>
                  {doc.type === "claude-session" ? "claude" : doc.type}
                </SignalBadge>
              </div>

              <h4 className="font-medium text-[var(--text-primary)] line-clamp-2 text-sm mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
                {doc.title}
              </h4>

              <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                {doc.content.slice(0, 100)}...
              </p>

              {doc.metadata.date && (
                <p className="text-[10px] text-[var(--text-muted)] mt-2 font-mono">
                  {new Date(doc.metadata.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getHref(doc: RelatedDocument): string {
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
