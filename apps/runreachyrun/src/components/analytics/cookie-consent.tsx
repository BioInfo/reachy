"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
    // Dispatch event to notify GA component
    window.dispatchEvent(new Event("cookie-consent-update"));
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg shadow-2xl shadow-black/20">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-mono text-sm font-medium text-[var(--text-primary)] mb-1">
                    Cookie Notice
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    We use cookies and Google Analytics to understand how visitors interact with this site.
                    This helps improve the experience. No personal data is sold or shared with third parties.{" "}
                    <Link
                      href="/privacy"
                      className="text-[var(--accent-cyan)] hover:underline"
                    >
                      Learn more
                    </Link>
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={handleDecline}
                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 text-sm font-medium bg-[var(--accent-cyan)] text-black rounded-md hover:bg-[var(--accent-cyan)]/90 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
