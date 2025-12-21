"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { SignalBadge } from "@/components/ui/signal-badge";

interface HuggingFaceSpaceProps {
  spaceId: string;
  title: string;
  description: string;
  status: "live" | "coming-soon" | "development";
  thumbnail?: string;
  tags?: string[];
}

export function HuggingFaceSpace({
  spaceId,
  title,
  description,
  status,
  thumbnail,
  tags = [],
}: HuggingFaceSpaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const embedUrl = `https://huggingface.co/spaces/${spaceId}`;
  const iframeSrc = embedUrl.includes("huggingface.co")
    ? embedUrl.replace("huggingface.co/spaces", "hf.space")
    : embedUrl;

  const statusVariant =
    status === "live"
      ? "success"
      : status === "development"
        ? "amber"
        : "default";

  return (
    <Card variant="interactive" className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <SignalBadge variant={statusVariant} pulse={status === "live"}>
            {status === "live"
              ? "live"
              : status === "development"
                ? "in dev"
                : "coming soon"}
          </SignalBadge>
          {status === "live" && (
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
            >
              open in HF &rarr;
            </a>
          )}
        </div>

        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          {description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs text-[var(--text-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {status === "live" && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 px-4 rounded-lg border border-[var(--border-default)] text-sm font-mono text-[var(--text-secondary)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            {isExpanded ? "collapse" : "expand demo"}
          </button>
        )}

        {status !== "live" && thumbnail && (
          <div className="relative rounded-lg overflow-hidden bg-[var(--bg-tertiary)] aspect-video">
            <img
              src={thumbnail}
              alt={`${title} preview`}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-mono text-[var(--text-muted)]">
                {status === "development" ? "in development" : "coming soon"}
              </span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && status === "live" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-[var(--border-subtle)]"
          >
            <div className="relative w-full" style={{ paddingBottom: "75%" }}>
              <iframe
                src={iframeSrc}
                className="absolute inset-0 w-full h-full"
                title={title}
                allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; document-domain; encrypted-media; fullscreen; geolocation; gyroscope; layout-animations; legacy-image-formats; magnetometer; microphone; midi; oversized-images; payment; picture-in-picture; publickey-credentials-get; sync-xhr; usb; vr; wake-lock; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
