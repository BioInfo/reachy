"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-6 rounded-xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-secondary)]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          {/* Terminal dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
          </div>
          {language && (
            <span className="font-mono text-xs text-[var(--accent-cyan)] uppercase tracking-wider">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-[var(--text-secondary)]">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface TableOfContentsProps {
  headings: { id: string; text: string; level: number }[];
  activeId: string;
}

function TableOfContents({ headings, activeId }: TableOfContentsProps) {
  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block fixed right-8 top-32 w-56 max-h-[calc(100vh-10rem)] overflow-y-auto">
      <div className="border-l-2 border-[var(--border-subtle)] pl-4">
        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
          On this page
        </p>
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={`block text-sm transition-colors ${
                  activeId === heading.id
                    ? "text-[var(--accent-cyan)] font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollPercent);
    };

    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 h-0.5 bg-[var(--bg-tertiary)] z-40">
      <motion.div
        className="h-full bg-[var(--accent-cyan)]"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}

// Parse inline markdown elements
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Inline code (backticks)
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`([\s\S]*)/);
    if (codeMatch && codeMatch[1] !== undefined) {
      if (codeMatch[1]) {
        parts.push(...parseInline(codeMatch[1]));
      }
      parts.push(
        <code
          key={`code-${keyIndex++}`}
          className="font-mono text-[0.9em] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-md text-[var(--accent-cyan)] border border-[var(--border-subtle)]"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3] || "";
      continue;
    }

    // Links
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)([\s\S]*)/);
    if (linkMatch && linkMatch[1] !== undefined) {
      if (linkMatch[1]) {
        parts.push(...parseInline(linkMatch[1]));
      }
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[3]}
          className="text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-dim)] underline underline-offset-2 decoration-[var(--accent-cyan)]/30 hover:decoration-[var(--accent-cyan)] transition-colors"
          target={linkMatch[3].startsWith("http") ? "_blank" : undefined}
          rel={linkMatch[3].startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {linkMatch[2]}
        </a>
      );
      remaining = linkMatch[4] || "";
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*([\s\S]*)/);
    if (boldMatch && boldMatch[1] !== undefined) {
      if (boldMatch[1]) {
        parts.push(...parseInline(boldMatch[1]));
      }
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-[var(--text-primary)]">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3] || "";
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^(.*?)_([^_]+)_([\s\S]*)/);
    if (italicMatch && italicMatch[1] !== undefined) {
      if (italicMatch[1]) {
        parts.push(...parseInline(italicMatch[1]));
      }
      parts.push(
        <em key={`italic-${keyIndex++}`} className="italic text-[var(--text-secondary)]">
          {italicMatch[2]}
        </em>
      );
      remaining = italicMatch[3] || "";
      continue;
    }

    // No more matches
    parts.push(remaining);
    break;
  }

  return parts;
}

// Slugify text for heading IDs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface BlogRendererProps {
  content: string;
}

export function BlogRenderer({ content }: BlogRendererProps) {
  const [activeHeading, setActiveHeading] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse content into blocks
  const { blocks, headings } = useMemo(() => {
    const lines = content.split("\n");
    const blocks: Array<{
      type: "paragraph" | "heading" | "code" | "list" | "blockquote" | "timeline";
      content: string;
      language?: string;
      level?: number;
      id?: string;
    }> = [];
    const headings: Array<{ id: string; text: string; level: number }> = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith("```")) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push({ type: "code", content: codeLines.join("\n"), language });
        i++;
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const id = slugify(text);
        blocks.push({ type: "heading", content: text, level, id });
        if (level === 2) {
          headings.push({ id, text, level });
        }
        i++;
        continue;
      }

      // Lists
      if (line.match(/^-\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^-\s+/)) {
          listItems.push(lines[i].replace(/^-\s+/, ""));
          i++;
        }
        blocks.push({ type: "list", content: listItems.join("\n") });
        continue;
      }

      // Timeline items (lines starting with "- X:XX")
      if (line.match(/^-\s+\d+:\d+/)) {
        const timelineItems: string[] = [];
        while (i < lines.length && lines[i].match(/^-\s+\d+:\d+/)) {
          timelineItems.push(lines[i].replace(/^-\s+/, ""));
          i++;
        }
        blocks.push({ type: "timeline", content: timelineItems.join("\n") });
        continue;
      }

      // Blockquotes
      if (line.startsWith(">")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith(">")) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        blocks.push({ type: "blockquote", content: quoteLines.join("\n") });
        continue;
      }

      // Paragraph (non-empty lines)
      if (line.trim()) {
        const paragraphLines: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim() &&
          !lines[i].startsWith("#") &&
          !lines[i].startsWith("```") &&
          !lines[i].startsWith("-") &&
          !lines[i].startsWith(">")
        ) {
          paragraphLines.push(lines[i]);
          i++;
        }
        blocks.push({ type: "paragraph", content: paragraphLines.join(" ") });
        continue;
      }

      i++;
    }

    return { blocks, headings };
  }, [content]);

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    const headingElements = contentRef.current?.querySelectorAll("h2[id]");
    headingElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [blocks]);

  return (
    <>
      <ReadingProgress />
      <TableOfContents headings={headings} activeId={activeHeading} />

      <div ref={contentRef} className="blog-content">
        {blocks.map((block, index) => {
          switch (block.type) {
            case "heading": {
              const level = block.level ?? 2;
              const headingClasses: Record<number, string> = {
                1: "text-4xl font-bold mt-12 mb-6",
                2: "text-2xl font-bold mt-14 mb-5 text-[var(--text-primary)] scroll-mt-24 border-b border-[var(--border-subtle)] pb-3",
                3: "text-xl font-semibold mt-8 mb-4 text-[var(--text-primary)]",
                4: "text-lg font-semibold mt-6 mb-3 text-[var(--text-primary)]",
                5: "text-base font-semibold mt-4 mb-2",
                6: "text-sm font-semibold mt-4 mb-2",
              };
              const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
              return (
                <Tag key={index} id={block.id} className={headingClasses[level] || ""}>
                  {block.content}
                </Tag>
              );
            }

            case "code":
              return <CodeBlock key={index} code={block.content} language={block.language} />;

            case "list":
              return (
                <ul key={index} className="my-6 space-y-3">
                  {block.content.split("\n").map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[var(--text-secondary)] leading-relaxed"
                    >
                      <span className="text-[var(--accent-cyan)] mt-1.5 flex-shrink-0">
                        <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                          <circle cx="3" cy="3" r="3" />
                        </svg>
                      </span>
                      <span>{parseInline(item)}</span>
                    </li>
                  ))}
                </ul>
              );

            case "timeline":
              return (
                <div key={index} className="my-8 relative">
                  <div className="absolute left-[3.25rem] top-2 bottom-2 w-px bg-[var(--border-default)]" />
                  <div className="space-y-4">
                    {block.content.split("\n").map((item, i) => {
                      const match = item.match(/^(\d+:\d+)\.\s*(.+)$/);
                      if (!match) return null;
                      return (
                        <div key={i} className="flex items-start gap-4 relative">
                          <span className="font-mono text-sm text-[var(--accent-amber)] w-12 flex-shrink-0 text-right">
                            {match[1]}
                          </span>
                          <span className="absolute left-[3rem] top-2 w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)] border-2 border-[var(--bg-primary)]" />
                          <span className="text-[var(--text-secondary)] leading-relaxed pl-4">
                            {parseInline(match[2])}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

            case "blockquote":
              return (
                <blockquote
                  key={index}
                  className="my-6 pl-6 border-l-4 border-[var(--accent-amber)] bg-[var(--accent-amber-glow)] rounded-r-lg py-4 pr-4"
                >
                  <p className="text-[var(--text-secondary)] italic leading-relaxed">
                    {parseInline(block.content)}
                  </p>
                </blockquote>
              );

            case "paragraph":
              return (
                <p
                  key={index}
                  className="text-[var(--text-secondary)] leading-[1.8] my-5 text-[1.0625rem]"
                >
                  {parseInline(block.content)}
                </p>
              );

            default:
              return null;
          }
        })}
      </div>
    </>
  );
}
