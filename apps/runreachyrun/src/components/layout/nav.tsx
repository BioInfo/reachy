"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignalBadge } from "@/components/ui/signal-badge";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme";
import { timelineData } from "@/content/timeline/data";
import { journalEntries } from "@/content/journal/data";

const navItems = [
  { label: "Timeline", href: "/timeline" },
  { label: "Journal", href: "/journal" },
  { label: "Apps", href: "/apps" },
  { label: "Blog", href: "/blog" },
  { label: "Claude", href: "/claude" },
];

export function Nav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <motion.div
            className="w-8 h-8 rounded-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/logo.png"
              alt="runreachyrun"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <span className="font-mono text-base sm:text-lg font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">
            runreachyrun
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-2 font-mono text-sm transition-colors
                  ${
                    isActive
                      ? "text-[var(--accent-cyan)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)]"
                    layoutId="nav-underline"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side: Search + Status + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="font-mono text-xs">Search</span>
            <kbd className="ml-1 px-1.5 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs font-mono rounded">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          <SignalBadge variant="cyan" pulse className="hidden sm:inline-flex">
            building
          </SignalBadge>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      block px-4 py-3 font-mono text-sm rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-[var(--accent-cyan-glow)] text-[var(--accent-cyan)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-3 px-4">
                <SignalBadge variant="cyan" pulse>
                  building
                </SignalBadge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        timelineNodes={timelineData}
        journalEntries={journalEntries}
      />
    </header>
  );
}
