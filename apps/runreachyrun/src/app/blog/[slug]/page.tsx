import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { GiscusComments } from "@/components/blog/giscus-comments";
import { BlogRenderer } from "@/components/blog/blog-renderer";
import { RelatedContent } from "@/components/ui/related-content";
import { getPostBySlug, getAllSlugs } from "@/content/blog/data";

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Revalidate every 5 minutes
export const revalidate = 300;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <article className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <header className="mb-16">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors mb-8 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to blog
            </Link>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <SignalBadge variant="success">published</SignalBadge>
              {post.readingTime && (
                <span className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {post.readingTime} min read
                </span>
              )}
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {formattedDate}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-[1.15] tracking-tight">
              {post.title}
            </h1>

            {/* Summary */}
            <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-6 max-w-2xl">
              {post.summary}
            </p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 font-mono text-xs text-[var(--accent-cyan)] bg-[var(--accent-cyan-glow)] border border-[var(--accent-cyan)]/20 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Cross-post notice */}
            {post.crossPostedTo && (
              <div className="mt-6 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent-amber)]">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span className="text-sm text-[var(--text-muted)]">
                  Also published on{" "}
                  <a
                    href={`https://${post.crossPostedTo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-cyan)] hover:underline"
                  >
                    {post.crossPostedTo}
                  </a>
                </span>
              </div>
            )}
          </header>

          {/* Decorative divider */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
            <span className="text-[var(--accent-cyan)]">◆</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
          </div>

          {/* Content */}
          <BlogRenderer content={post.content} />

          {/* AI-powered Related Content */}
          <RelatedContent
            currentId={`blog-${slug}`}
            limit={3}
            className="mt-16 pt-12 border-t border-[var(--border-subtle)]"
          />

          {/* Comments */}
          <GiscusComments className="mt-16 pt-12 border-t border-[var(--border-subtle)]" />

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 text-sm font-mono text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] transition-colors"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                More posts
              </Link>

              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--text-muted)]">Also writing at</span>
                <a
                  href="https://rundatarun.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-colors"
                >
                  rundatarun.io
                  <span className="text-[var(--text-muted)]">→</span>
                </a>
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </>
  );
}
