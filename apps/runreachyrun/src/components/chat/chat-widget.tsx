"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { useChat } from "./chat-provider";
import Link from "next/link";

type ViewMode = "closed" | "compact" | "expanded";

export function ChatWidget() {
  const { messages, isLoading, isOpen, sendMessage, toggleChat, clearHistory } =
    useChat();
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("closed");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync viewMode with isOpen from context
  useEffect(() => {
    if (isOpen && viewMode === "closed") {
      setViewMode("compact");
    } else if (!isOpen && viewMode !== "closed") {
      setViewMode("closed");
    }
  }, [isOpen, viewMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (viewMode !== "closed") {
      inputRef.current?.focus();
    }
  }, [viewMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleToggle = () => {
    if (viewMode === "closed") {
      setViewMode("compact");
      if (!isOpen) toggleChat();
    } else {
      setViewMode("closed");
      if (isOpen) toggleChat();
    }
  };

  const handleExpand = () => {
    setViewMode(viewMode === "expanded" ? "compact" : "expanded");
  };

  const isExpanded = viewMode === "expanded";

  return (
    <>
      {/* Chat Toggle Button - hidden when expanded */}
      <AnimatePresence>
        {viewMode !== "expanded" && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleToggle}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={viewMode === "closed" ? "Open chat" : "Close chat"}
          >
            <AnimatePresence mode="wait">
              {viewMode !== "closed" ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <MessageCircle className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop for expanded mode */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {viewMode !== "closed" && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-2xl flex flex-col overflow-hidden ${
              isExpanded
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-w-[90vw] h-[600px] max-h-[85vh]"
                : "bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)]"
            }`}
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-3">
                {/* Window dots */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggle}
                    className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all"
                    aria-label="Close"
                  />
                  <button
                    onClick={() => setViewMode("compact")}
                    className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all"
                    aria-label="Minimize"
                  />
                  <button
                    onClick={handleExpand}
                    className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all"
                    aria-label="Expand"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                  <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                    Ask about Reachy
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Clear chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleExpand}
                  className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[var(--text-muted)] text-sm py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-[var(--accent-cyan)]" />
                  </div>
                  <p className="mb-4 text-[var(--text-secondary)]">
                    Ask me anything about the Reachy Mini project!
                  </p>
                  <div className="space-y-2 text-xs max-w-xs mx-auto">
                    <button
                      onClick={() => sendMessage("What is Focus Guardian?")}
                      className="block w-full px-3 py-2 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-left transition-colors border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]"
                    >
                      &quot;What is Focus Guardian?&quot;
                    </button>
                    <button
                      onClick={() => sendMessage("How does DJ Reactor work?")}
                      className="block w-full px-3 py-2 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-left transition-colors border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]"
                    >
                      &quot;How does DJ Reactor work?&quot;
                    </button>
                    <button
                      onClick={() => sendMessage("What did Claude help build?")}
                      className="block w-full px-3 py-2 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-left transition-colors border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]"
                    >
                      &quot;What did Claude help build?&quot;
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[var(--accent-cyan)] text-[var(--bg-primary)]"
                        : "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <div className="text-sm">
                        <MarkdownContent content={message.content} />
                      </div>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                        <p className="text-xs text-[var(--text-muted)] mb-2 font-mono">
                          Sources:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {message.sources.map((source) => (
                            <Link
                              key={source.id}
                              href={getSourceUrl(source.id, source.type)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-subtle)]"
                            >
                              {source.title}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-primary)] rounded-lg px-4 py-3 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-cyan)]" />
                      <span className="text-sm text-[var(--text-muted)]">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-3 rounded-lg bg-[var(--accent-cyan)] text-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Render markdown content with proper formatting
 */
function MarkdownContent({ content }: { content: string }) {
  const elements = useMemo(() => parseMarkdown(content), [content]);
  return <>{elements}</>;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" = "ul";

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType;
      elements.push(
        <ListTag
          key={key++}
          className={`my-2 space-y-1 ${listType === "ol" ? "list-decimal" : "list-disc"} list-inside text-[var(--text-secondary)]`}
        >
          {listItems}
        </ListTag>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet list
    if (line.match(/^[\*\-]\s+/)) {
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
      }
      listItems.push(
        <li key={key++} className="text-[var(--text-secondary)]">
          {formatInline(line.replace(/^[\*\-]\s+/, ""))}
        </li>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
      }
      listItems.push(
        <li key={key++} className="text-[var(--text-secondary)]">
          {formatInline(line.replace(/^\d+\.\s+/, ""))}
        </li>
      );
      continue;
    }

    // Not a list item, flush any pending list
    flushList();

    // Empty line
    if (!line.trim()) {
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h4
          key={key++}
          className="font-semibold text-[var(--text-primary)] mt-3 mb-1"
        >
          {line.slice(4)}
        </h4>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h3
          key={key++}
          className="font-semibold text-[var(--text-primary)] mt-3 mb-1"
        >
          {line.slice(3)}
        </h3>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-[var(--text-secondary)] mb-2 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }

  // Flush any remaining list
  flushList();

  return elements;
}

function formatInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Links: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [full, linkText, url] = linkMatch;
      const isExternal = url.startsWith("http");
      result.push(
        isExternal ? (
          <a
            key={key++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-cyan)] hover:underline inline-flex items-center gap-0.5"
          >
            {linkText}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <Link
            key={key++}
            href={url}
            className="text-[var(--accent-cyan)] hover:underline"
          >
            {linkText}
          </Link>
        )
      );
      remaining = remaining.slice(full.length);
      continue;
    }

    // URLs without markdown: https://...
    const urlMatch = remaining.match(/^(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const [url] = urlMatch;
      result.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-cyan)] hover:underline break-all inline-flex items-center gap-0.5"
        >
          {url.length > 40 ? url.slice(0, 40) + "..." : url}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
      remaining = remaining.slice(url.length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      result.push(
        <code
          key={key++}
          className="font-mono text-xs bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--accent-cyan)]"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)([^*_]+)\1/);
    if (boldMatch) {
      result.push(
        <strong key={key++} className="font-semibold text-[var(--text-primary)]">
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
    if (italicMatch) {
      result.push(
        <em key={key++} className="italic">
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text until next special character
    const nextSpecial = remaining.search(/[\[`*_]|https?:\/\//);
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

function getSourceUrl(id: string, type: string): string {
  const slug = id.replace(`${type}-`, "");
  switch (type) {
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
