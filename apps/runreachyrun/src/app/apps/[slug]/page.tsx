"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { SignalLine } from "@/components/ui/signal-line";
import { Icon } from "@/components/ui/icon";
import { getAppBySlug } from "@/content/apps/data";
import { getTimelineSorted } from "@/content/timeline/data";
import { journalEntries } from "@/content/journal/data";

type TabId = "quickstart" | "config" | "troubleshooting";

export default function AppDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const app = getAppBySlug(slug);
  const [activeTab, setActiveTab] = useState<TabId>("quickstart");

  if (!app) {
    return (
      <>
        <Nav />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-mono text-[var(--text-primary)] mb-4">
              App not found
            </h1>
            <Link
              href="/apps"
              className="text-[var(--accent-cyan)] hover:underline"
            >
              &larr; Back to apps
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const statusVariant =
    app.status === "live"
      ? "success"
      : app.status === "development"
        ? "amber"
        : "default";

  const statusLabel =
    app.status === "live"
      ? "Live"
      : app.status === "development"
        ? "In Development"
        : "Coming Soon";

  // Get related content
  const relatedTimeline = getTimelineSorted().filter((node) =>
    app.timelineNodes.includes(node.id)
  );
  const relatedJournal = journalEntries.filter((entry) =>
    app.journalEntries.includes(entry.slug)
  );

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
              <Link href="/apps" className="hover:text-[var(--accent-cyan)]">
                Apps
              </Link>
              <span>/</span>
              <span className="text-[var(--text-secondary)]">{app.title}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 text-[var(--accent-cyan)]">
                <Icon name={app.icon} size={40} strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                {/* Title + Status */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-mono font-bold text-[var(--text-primary)]">
                    {app.title}
                  </h1>
                  <SignalBadge variant={statusVariant} pulse={app.status === "live"}>
                    {statusLabel}
                  </SignalBadge>
                </div>

                {/* Tagline */}
                <p className="text-xl text-[var(--text-secondary)] mb-4">
                  {app.tagline}
                </p>

                {/* Description */}
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6 max-w-2xl">
                  {app.description}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {app.huggingFaceUrl && (
                    <a
                      href={app.huggingFaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-mono text-sm rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Try on HuggingFace &rarr;
                    </a>
                  )}
                  <a
                    href={app.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-sm rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    View Source
                  </a>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                  {app.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-mono rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Demo Section */}
        {(app.demoEmbed || app.screenshots.length > 0 || app.heroVideo) && (
          <section className="max-w-5xl mx-auto px-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
                See It In Action
              </h2>

              {app.demoEmbed ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-[var(--bg-tertiary)]" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={app.demoEmbed.replace("huggingface.co/spaces", "hf.space")}
                    className="absolute inset-0 w-full h-full"
                    title={`${app.title} Demo`}
                    allow="accelerometer; autoplay; camera; microphone"
                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                  />
                </div>
              ) : app.heroVideo ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-[var(--bg-tertiary)]" style={{ paddingBottom: "56.25%" }}>
                  <video
                    src={app.heroVideo}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              ) : app.screenshots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {app.screenshots.map((screenshot, i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                      <img
                        src={screenshot.src}
                        alt={screenshot.alt}
                        className="w-full h-auto"
                      />
                      {screenshot.caption && (
                        <p className="p-3 text-sm text-[var(--text-muted)]">
                          {screenshot.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-[var(--text-muted)]">
                    Demo coming soon — check back after launch!
                  </p>
                </Card>
              )}
            </motion.div>
          </section>
        )}

        {/* Demo placeholder for apps without media yet */}
        {!app.demoEmbed && app.screenshots.length === 0 && !app.heroVideo && (
          <section className="max-w-5xl mx-auto px-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="p-12 text-center border-dashed">
                <div className="mb-4 flex justify-center text-[var(--accent-cyan)]">
                  <Icon name={app.icon} size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-mono text-[var(--text-primary)] mb-2">
                  Demo Coming Soon
                </h3>
                <p className="text-[var(--text-muted)] max-w-md mx-auto">
                  {app.status === "coming-soon"
                    ? "This app is still in the planning phase. Check back soon!"
                    : "We're working on recording a demo. In the meantime, try running it yourself!"}
                </p>
              </Card>
            </motion.div>
          </section>
        )}

        {/* Features Grid */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
              Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {app.features.map((feature, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 text-[var(--accent-cyan)]">
                      <Icon name={feature.icon} size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
              How It Works
            </h2>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--border-subtle)] hidden md:block" />

              <div className="space-y-6">
                {app.howItWorks.map((step, i) => (
                  <div key={i} className="flex gap-6">
                    {/* Step number */}
                    <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                      <span className="font-mono font-bold text-[var(--accent-cyan)]">
                        {step.step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Getting Started Tabs */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
              Getting Started
            </h2>

            {/* Prerequisites */}
            <Card className="p-5 mb-6">
              <h3 className="font-mono text-sm text-[var(--text-muted)] mb-3">
                Prerequisites
              </h3>
              <ul className="space-y-2">
                {app.prerequisites.map((prereq, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--accent-cyan)]">•</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-[var(--border-subtle)]">
              {[
                { id: "quickstart" as TabId, label: "Quick Start" },
                { id: "config" as TabId, label: "Configuration" },
                { id: "troubleshooting" as TabId, label: "Troubleshooting" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-mono text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? "text-[var(--accent-cyan)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <Card className="p-5">
              {activeTab === "quickstart" && (
                <pre className="font-mono text-sm text-[var(--text-secondary)] whitespace-pre-wrap overflow-x-auto">
                  {app.quickStart}
                </pre>
              )}

              {activeTab === "config" && (
                app.configuration ? (
                  <pre className="font-mono text-sm text-[var(--text-secondary)] whitespace-pre-wrap overflow-x-auto">
                    {app.configuration}
                  </pre>
                ) : (
                  <p className="text-[var(--text-muted)]">
                    Configuration options coming soon.
                  </p>
                )
              )}

              {activeTab === "troubleshooting" && (
                app.troubleshooting && app.troubleshooting.length > 0 ? (
                  <div className="space-y-4">
                    {app.troubleshooting.map((item, i) => (
                      <div key={i}>
                        <h4 className="font-medium text-[var(--text-primary)] mb-1">
                          {item.problem}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {item.solution}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)]">
                    No common issues documented yet.
                  </p>
                )
              )}
            </Card>
          </motion.div>
        </section>

        {/* The Build Story */}
        {(app.claudeContributions?.length || app.learnings?.length) && (
          <section className="max-w-5xl mx-auto px-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-mono font-medium text-[var(--text-primary)]">
                  The Build Story
                </h2>
                <SignalBadge variant="amber">claude code</SignalBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Claude Contributions */}
                {app.claudeContributions && app.claudeContributions.length > 0 && (
                  <div>
                    <h3 className="font-mono text-sm text-[var(--text-muted)] mb-3">
                      Claude Contributions
                    </h3>
                    <div className="space-y-3">
                      {app.claudeContributions.map((contrib, i) => (
                        <Card key={i} className="p-4">
                          <h4 className="font-medium text-[var(--text-primary)] mb-1">
                            {contrib.title}
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] mb-2">
                            {contrib.description}
                          </p>
                          {contrib.prompt && (
                            <p className="text-xs text-[var(--text-muted)] italic border-l-2 border-[var(--accent-amber)] pl-2">
                              "{contrib.prompt}"
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learnings */}
                {app.learnings && app.learnings.length > 0 && (
                  <div>
                    <h3 className="font-mono text-sm text-[var(--text-muted)] mb-3">
                      What I Learned
                    </h3>
                    <Card className="p-4">
                      <ul className="space-y-2">
                        {app.learnings.map((learning, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <span className="text-[var(--semantic-success)]">→</span>
                            {learning}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        )}

        {/* Related Content */}
        {(relatedTimeline.length > 0 || relatedJournal.length > 0) && (
          <section className="max-w-5xl mx-auto px-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-6">
                Related Content
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline */}
                {relatedTimeline.length > 0 && (
                  <div>
                    <h3 className="font-mono text-sm text-[var(--text-muted)] mb-3">
                      From the Timeline
                    </h3>
                    <div className="space-y-2">
                      {relatedTimeline.map((node) => (
                        <Link key={node.id} href={`/timeline#${node.id}`}>
                          <Card variant="interactive" className="p-3">
                            <div className="flex items-center gap-3">
                              <SignalBadge variant={node.type === "breakthrough" ? "success" : node.type === "failure" ? "failure" : "default"}>
                                {node.type}
                              </SignalBadge>
                              <span className="text-sm text-[var(--text-primary)]">
                                {node.title}
                              </span>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Journal */}
                {relatedJournal.length > 0 && (
                  <div>
                    <h3 className="font-mono text-sm text-[var(--text-muted)] mb-3">
                      Journal Entries
                    </h3>
                    <div className="space-y-2">
                      {relatedJournal.map((entry) => (
                        <Link key={entry.slug} href={`/journal/${entry.slug}`}>
                          <Card variant="interactive" className="p-3">
                            <span className="text-sm text-[var(--text-primary)]">
                              {entry.title}
                            </span>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        )}

        <SignalLine className="max-w-5xl mx-auto mb-8" />

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/apps"
            className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm transition-colors"
          >
            &larr; back to all apps
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
