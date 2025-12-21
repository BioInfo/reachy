"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { appsData } from "@/content/apps/data";

export function AppsShowcase() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              Apps & Demos
            </h2>
            <SignalBadge variant="amber">{appsData.length} apps</SignalBadge>
          </div>
          <p className="text-[var(--text-secondary)]">
            Interactive experiments powered by Reachy Mini
          </p>
        </div>
        <Link
          href="/apps"
          className="text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] font-mono text-sm transition-colors hidden md:block"
        >
          View all apps &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appsData.map((app, index) => {
          const statusVariant =
            app.status === "live"
              ? "success"
              : app.status === "development"
                ? "amber"
                : "default";
          const statusLabel =
            app.status === "live"
              ? "live"
              : app.status === "development"
                ? "in dev"
                : "coming soon";

          return (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={`/apps/${app.slug}`}>
                <Card variant="interactive" className="p-6 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-[var(--accent-cyan)]">
                        <Icon name={app.icon} size={24} strokeWidth={1.5} />
                      </div>
                      <SignalBadge
                        variant={statusVariant}
                        pulse={app.status === "live"}
                      >
                        {statusLabel}
                      </SignalBadge>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                    {app.title}
                  </h3>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {app.tagline}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {app.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-mono rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 text-center md:hidden">
        <Link
          href="/apps"
          className="text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] font-mono text-sm transition-colors"
        >
          View all apps &rarr;
        </Link>
      </div>
    </div>
  );
}
