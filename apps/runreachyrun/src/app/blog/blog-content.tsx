"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { SignalLine } from "@/components/ui/signal-line";
import { PenTool } from "@/components/ui/icon";
import type { BlogPostWithSlug } from "@/lib/content";

interface BlogContentProps {
  posts: BlogPostWithSlug[];
}

export function BlogContent({ posts }: BlogContentProps) {
  const hasPosts = posts.length > 0;

  // Separate by status
  const readyPosts = posts.filter((p) => p.status === "ready" || p.status === "published");
  const draftPosts = posts.filter((p) => p.status === "draft");
  const ideaPosts = posts.filter((p) => p.status === "idea");

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-mono font-bold text-[var(--text-primary)]">
            Blog
          </h1>
          <SignalBadge variant={hasPosts ? "cyan" : "amber"}>
            {hasPosts ? `${posts.length} posts` : "coming soon"}
          </SignalBadge>
        </div>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          Long-form writing about building with Reachy Mini. Technical
          deep-dives, lessons learned, and the occasional philosophical
          tangent about human-robot collaboration.
        </p>
      </motion.div>

      {hasPosts ? (
        <>
          {/* Ready/Published Posts */}
          {readyPosts.length > 0 && (
            <section className="mb-12">
              <div className="space-y-6">
                {readyPosts.map((post, index) => {
                  return (
                    <motion.article
                      key={post.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Link href={`/blog/${post.slug}`}>
                        <Card variant="interactive" className="p-6 cursor-pointer hover:border-[var(--accent-cyan)] transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <SignalBadge variant="success">
                              {post.status}
                            </SignalBadge>
                            {post.target && (
                              <span className="font-mono text-xs text-[var(--text-muted)]">
                                {post.target}
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-medium text-[var(--text-primary)] mb-3">
                            {post.title}
                          </h2>
                          {post.hook && (
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                              {post.hook}
                            </p>
                          )}
                          <div className="mt-4 text-sm font-mono text-[var(--accent-cyan)]">
                            Read more →
                          </div>
                        </Card>
                      </Link>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Drafts in Progress */}
          {draftPosts.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-mono font-medium text-[var(--text-primary)]">
                  Drafts in Progress
                </h2>
                <SignalBadge variant="amber">{draftPosts.length}</SignalBadge>
              </div>
              <div className="space-y-4">
                {draftPosts.map((post, index) => (
                  <motion.div
                    key={post.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  >
                    <Card className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {post.title}
                        </h3>
                        <SignalBadge variant="amber">draft</SignalBadge>
                      </div>
                      {post.hook && (
                        <p className="text-sm text-[var(--text-secondary)] italic mb-2">
                          "{post.hook}"
                        </p>
                      )}
                      {post.angle && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {post.angle}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Ideas / On the Writing List */}
          {ideaPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="pt-12 border-t border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-mono font-medium text-[var(--text-primary)]">
                  On the Writing List
                </h2>
                <SignalBadge variant="default">planned</SignalBadge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideaPosts.map((post, index) => (
                  <motion.div
                    key={post.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="p-5 h-full">
                      <h3 className="font-medium text-[var(--text-primary)] mb-2">
                        {post.title}
                      </h3>
                      {post.hook && (
                        <p className="text-sm text-[var(--text-secondary)] mb-3 italic">
                          "{post.hook}"
                        </p>
                      )}
                      {post.angle && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {post.angle}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center py-16"
        >
          <div className="relative mb-8">
            <SignalLine animate className="opacity-30" />
          </div>

          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
            <PenTool className="text-[var(--accent-amber)]" size={28} strokeWidth={1.5} />
          </div>

          <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-3">
            Posts incoming
          </h2>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
            Still building, learning, and collecting thoughts. The first
            posts are brewing — check back soon or follow the journal for
            raw updates in the meantime.
          </p>

          <Link
            href="/journal"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-mono text-sm rounded-lg hover:bg-[var(--accent-cyan-dim)] transition-colors"
          >
            Read the journal instead &rarr;
          </Link>
        </motion.div>
      )}

      {/* Cross-promo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-[var(--text-muted)]">
          Also writing at{" "}
          <a
            href="https://rundatarun.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-cyan)] hover:underline"
          >
            rundatarun.io
          </a>{" "}
          — AI, data science, and the occasional robotics crossover.
        </p>
      </motion.div>

      {/* Back link */}
      <div className="text-center mt-8">
        <Link
          href="/"
          className="text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm transition-colors"
        >
          &larr; back to home
        </Link>
      </div>
    </>
  );
}
