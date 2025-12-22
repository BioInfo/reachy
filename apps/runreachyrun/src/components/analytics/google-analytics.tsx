"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

// Check if user has consented to cookies
function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cookie-consent") === "accepted";
}

export function GoogleAnalytics() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasConsent());

    // Listen for consent changes
    const handleStorage = () => setConsent(hasConsent());
    window.addEventListener("storage", handleStorage);

    // Custom event for same-tab updates
    const handleConsent = () => setConsent(hasConsent());
    window.addEventListener("cookie-consent-update", handleConsent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cookie-consent-update", handleConsent);
    };
  }, []);

  if (!GA_MEASUREMENT_ID || !consent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}

// Utility to track page views (for use with App Router)
export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.gtag && hasConsent()) {
    window.gtag("config", GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }
}

// Utility to track events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag && hasConsent()) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Type declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}
