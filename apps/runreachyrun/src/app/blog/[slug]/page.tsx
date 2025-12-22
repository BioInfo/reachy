import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { GiscusComments } from "@/components/blog/giscus-comments";
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
          <header className="mb-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors mb-6"
            >
              ← Back to blog
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <SignalBadge variant="success">published</SignalBadge>
              {post.readingTime && (
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {post.readingTime} min read
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
              {post.title}
            </h1>

            <p className="text-lg text-[var(--text-secondary)] mb-4">
              {post.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-mono text-[var(--text-muted)]">
                {formattedDate}
              </span>
              {post.crossPostedTo && (
                <span className="text-[var(--text-muted)]">
                  Cross-posted to{" "}
                  <a
                    href={`https://${post.crossPostedTo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-cyan)] hover:underline"
                  >
                    {post.crossPostedTo}
                  </a>
                </span>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <BlogContent content={post.content} />
          </div>

          {/* Comments */}
          <GiscusComments className="mt-16 pt-8 border-t border-[var(--border-subtle)]" />

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Link
                href="/blog"
                className="text-sm font-mono text-[var(--accent-cyan)] hover:underline"
              >
                ← More posts
              </Link>
              <a
                href="https://rundatarun.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
              >
                Also writing at rundatarun.io →
              </a>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </>
  );
}

// Simple markdown-like content renderer using React components
function BlogContent({ content }: { content: string }) {
  const sections = content.split(/\n\n+/);

  return (
    <>
      {sections.map((section, index) => {
        const trimmed = section.trim();

        // Headers
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-2xl font-bold text-[var(--text-primary)] mt-10 mb-4"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }

        // Code blocks
        if (trimmed.startsWith("```")) {
          const lines = trimmed.split("\n");
          const code = lines.slice(1, -1).join("\n");
          return (
            <pre
              key={index}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg p-4 overflow-x-auto my-6"
            >
              <code className="font-mono text-sm text-[var(--text-secondary)]">
                {code}
              </code>
            </pre>
          );
        }

        // Lists (bullet points starting with "- ")
        if (trimmed.match(/^- /m)) {
          const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
          return (
            <ul key={index} className="list-none space-y-2 my-4">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="text-[var(--text-secondary)] pl-4 border-l-2 border-[var(--border-subtle)]"
                >
                  <InlineContent text={item.slice(2)} />
                </li>
              ))}
            </ul>
          );
        }

        // Regular paragraphs
        if (trimmed) {
          return (
            <p
              key={index}
              className="text-[var(--text-secondary)] leading-relaxed my-4"
            >
              <InlineContent text={trimmed} />
            </p>
          );
        }

        return null;
      })}
    </>
  );
}

// Render inline content (code, links, bold, italic) as React elements
function InlineContent({ text }: { text: string }) {
  // Parse and render inline elements
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Check for inline code
    const codeMatch = remaining.match(/^([^`]*)`([^`]+)`([\s\S]*)$/);
    if (codeMatch) {
      if (codeMatch[1]) {
        parts.push(<InlineContent key={keyIndex++} text={codeMatch[1]} />);
      }
      parts.push(
        <code
          key={keyIndex++}
          className="font-mono text-sm bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--accent-cyan)]"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
      continue;
    }

    // Check for links
    const linkMatch = remaining.match(/^([^\[]*)\[([^\]]+)\]\(([^)]+)\)([\s\S]*)$/);
    if (linkMatch) {
      if (linkMatch[1]) {
        parts.push(<InlineContent key={keyIndex++} text={linkMatch[1]} />);
      }
      parts.push(
        <a
          key={keyIndex++}
          href={linkMatch[3]}
          className="text-[var(--accent-cyan)] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[2]}
        </a>
      );
      remaining = linkMatch[4];
      continue;
    }

    // Check for bold
    const boldMatch = remaining.match(/^([^*]*)\*\*([^*]+)\*\*([\s\S]*)$/);
    if (boldMatch) {
      if (boldMatch[1]) {
        parts.push(<InlineContent key={keyIndex++} text={boldMatch[1]} />);
      }
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-[var(--text-primary)]">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
      continue;
    }

    // No more matches, add remaining text
    parts.push(remaining);
    break;
  }

  return <>{parts}</>;
}
