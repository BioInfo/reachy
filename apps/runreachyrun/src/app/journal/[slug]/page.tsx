import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { SignalBadge } from "@/components/ui/signal-badge";
import { Card } from "@/components/ui/card";
import { RelatedContent } from "@/components/ui/related-content";
import {
  getAllJournalEntries,
  getJournalEntryBySlug,
  getAllTimelineNodes,
} from "@/lib/content";

// Revalidate every 5 minutes
export const revalidate = 300;

type BadgeVariant = "cyan" | "amber" | "success" | "failure" | "default";

const moodConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  win: { variant: "success", label: "win" },
  struggle: { variant: "failure", label: "struggle" },
  neutral: { variant: "default", label: "neutral" },
  excited: { variant: "cyan", label: "excited" },
};

// Generate static paths for all journal entries
export async function generateStaticParams() {
  const entries = await getAllJournalEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

// Generate metadata for each entry
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getJournalEntryBySlug(slug);

  if (!entry) {
    return { title: "Entry Not Found — runreachyrun" };
  }

  return {
    title: `${entry.title} — runreachyrun`,
    description: entry.summary,
  };
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getJournalEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const mood = entry.mood ? moodConfig[entry.mood] : null;

  // Get linked timeline nodes
  const allTimelineNodes = await getAllTimelineNodes();
  const linkedNodes = entry.linkedTimeline
    ? allTimelineNodes.filter((node) => entry.linkedTimeline?.includes(node.id))
    : [];

  // Get prev/next entries
  const allEntries = await getAllJournalEntries();
  const currentIndex = allEntries.findIndex((e) => e.slug === slug);
  const prevEntry =
    currentIndex < allEntries.length - 1 ? allEntries[currentIndex + 1] : null;
  const nextEntry = currentIndex > 0 ? allEntries[currentIndex - 1] : null;

  const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <article className="max-w-3xl mx-auto px-6">
          {/* Back link */}
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-cyan)] font-mono text-sm mb-8 transition-colors"
          >
            <span>&larr;</span> Back to Journal
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-mono text-sm text-[var(--text-muted)]">
                {formattedDate}
              </span>
              {mood && (
                <SignalBadge variant={mood.variant}>{mood.label}</SignalBadge>
              )}
              {entry.readingTime && (
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {entry.readingTime} min read
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-mono font-bold text-[var(--text-primary)] mb-4 leading-tight">
              {entry.title}
            </h1>

            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
              {entry.summary}
            </p>

            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {entry.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/journal?tag=${tag}`}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Content - uses React elements, safe rendering */}
          <div className="prose-custom">
            <MarkdownRenderer content={entry.content} />
          </div>

          {linkedNodes.length > 0 && (
            <aside className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
              <h2 className="font-mono text-sm text-[var(--text-muted)] mb-4">
                Related Timeline
              </h2>
              <div className="space-y-3">
                {linkedNodes.map((node) => (
                  <Link key={node.id} href={`/timeline#${node.id}`}>
                    <Card variant="interactive" className="p-4">
                      <div className="flex items-center gap-3">
                        <SignalBadge
                          variant={
                            node.type === "milestone"
                              ? "cyan"
                              : node.type === "breakthrough"
                                ? "success"
                                : node.type === "failure"
                                  ? "failure"
                                  : "default"
                          }
                        >
                          {node.type}
                        </SignalBadge>
                        <span className="text-[var(--text-primary)]">
                          {node.title}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {entry.linkedCommits && entry.linkedCommits.length > 0 && (
            <aside className="mt-8">
              <h2 className="font-mono text-sm text-[var(--text-muted)] mb-3">
                Related Commits
              </h2>
              <div className="flex flex-wrap gap-2">
                {entry.linkedCommits.map((sha) => (
                  <a
                    key={sha}
                    href={`https://github.com/BioInfo/reachy/commit/${sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[var(--accent-cyan)] hover:underline px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]"
                  >
                    {sha.slice(0, 7)}
                  </a>
                ))}
              </div>
            </aside>
          )}

          <nav className="mt-16 pt-8 border-t border-[var(--border-subtle)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prevEntry ? (
                <Link
                  href={`/journal/${prevEntry.slug}`}
                  className="group p-4 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] transition-colors"
                >
                  <span className="font-mono text-xs text-[var(--text-muted)] block mb-1">
                    &larr; Previous
                  </span>
                  <span className="text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">
                    {prevEntry.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {nextEntry && (
                <Link
                  href={`/journal/${nextEntry.slug}`}
                  className="group p-4 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] transition-colors text-right"
                >
                  <span className="font-mono text-xs text-[var(--text-muted)] block mb-1">
                    Next &rarr;
                  </span>
                  <span className="text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">
                    {nextEntry.title}
                  </span>
                </Link>
              )}
            </div>
          </nav>

          {/* AI-powered Related Content */}
          <RelatedContent
            currentId={`journal-${slug}`}
            limit={3}
            className="mt-12 pt-8 border-t border-[var(--border-subtle)]"
          />
        </article>
      </main>

      <Footer />
    </>
  );
}

// Safe inline formatting using React elements only
function formatInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      result.push(
        <code
          key={key++}
          className="font-mono text-sm bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--accent-cyan)]"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      result.push(
        <strong key={key++} className="font-semibold text-[var(--text-primary)]">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/`|\*\*/);
    if (nextSpecial === -1) {
      result.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      result.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      result.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return result;
}

// Safe markdown renderer using React elements only - no innerHTML
function MarkdownRenderer({ content }: { content: string }) {
  const blocks = content.split("\n\n");

  return (
    <>
      {blocks.map((block, index) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-xl font-mono font-bold text-[var(--text-primary)] mt-8 mb-4"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }

        if (trimmed.startsWith("```")) {
          const lines = trimmed.split("\n");
          const lang = lines[0].slice(3);
          const code = lines.slice(1, -1).join("\n");
          return (
            <pre
              key={index}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg p-4 overflow-x-auto my-6"
            >
              {lang && (
                <span className="font-mono text-xs text-[var(--text-muted)] block mb-2">
                  {lang}
                </span>
              )}
              <code className="font-mono text-sm text-[var(--text-primary)]">
                {code}
              </code>
            </pre>
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-[var(--accent-cyan)] pl-4 my-6 text-[var(--text-secondary)] italic"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }

        if (trimmed.match(/^[0-9]+\. /) || trimmed.startsWith("- ")) {
          const items = trimmed.split("\n");
          const isOrdered = trimmed.match(/^[0-9]+\. /);
          const ListTag = isOrdered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={`my-4 space-y-2 ${isOrdered ? "list-decimal" : "list-disc"} list-inside text-[var(--text-secondary)]`}
            >
              {items.map((item, i) => (
                <li key={i}>{formatInline(item.replace(/^[0-9]+\. |- /, ""))}</li>
              ))}
            </ListTag>
          );
        }

        if (trimmed) {
          return (
            <p key={index} className="text-[var(--text-secondary)] leading-relaxed my-4">
              {formatInline(trimmed)}
            </p>
          );
        }

        return null;
      })}
    </>
  );
}
