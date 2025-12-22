"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { appsData } from "@/content/apps/data";

const upcomingIdeas = [
  {
    title: "Reachy RAG",
    description:
      "RAG-powered knowledge base for Reachy. Ask questions about the SDK, troubleshooting, or project history. Uses vector search over documentation and session logs.",
    tags: ["rag", "llm", "knowledge-base", "vector-search"],
  },
  {
    title: "Reachy Talks",
    description:
      "Voice-activated conversation with LLM integration. Ask Reachy questions, get animated responses.",
    tags: ["llm", "voice", "conversation"],
  },
  {
    title: "Emotion Mirror",
    description:
      "Reachy mirrors your detected emotions using facial expression analysis.",
    tags: ["vision", "emotions", "mirror"],
  },
  {
    title: "Twitch Plays Reachy",
    description:
      "Let Twitch chat control Reachy's movements and expressions in real-time.",
    tags: ["twitch", "community", "interactive"],
  },
];

export default function AppsPage() {
  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-mono font-bold text-[var(--text-primary)]">
                Apps & Demos
              </h1>
              <SignalBadge variant="cyan">{appsData.length} apps</SignalBadge>
            </div>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              Interactive experiments built with Reachy Mini. Each app explores
              a different aspect of human-robot interaction — productivity,
              entertainment, utility.
            </p>
          </motion.div>

          {/* Current Apps */}
          <section className="mb-16">
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
              Current Projects
            </h2>
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
                      <Card
                        variant="interactive"
                        className="p-6 h-full flex flex-col"
                      >
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
                          <span className="text-[var(--text-muted)] text-sm">
                            &rarr;
                          </span>
                        </div>

                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                          {app.title}
                        </h3>

                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 flex-1">
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
          </section>

          {/* Upcoming Ideas */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-mono font-medium text-[var(--text-primary)]">
                On the Radar
              </h2>
              <SignalBadge variant="amber">ideas</SignalBadge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingIdeas.map((idea, index) => (
                <motion.div
                  key={idea.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="p-5 h-full">
                    <h3 className="font-medium text-[var(--text-primary)] mb-2">
                      {idea.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {idea.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-xs text-[var(--text-muted)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-center py-12 border-t border-[var(--border-subtle)]"
          >
            <p className="text-[var(--text-secondary)] mb-4">
              Have an idea for a Reachy app?
            </p>
            <a
              href="https://github.com/BioInfo/reachy/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
            >
              Open an issue on GitHub &rarr;
            </a>
          </motion.section>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm transition-colors"
            >
              &larr; back to home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
