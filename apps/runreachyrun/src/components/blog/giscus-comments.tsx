"use client";

import { useEffect, useRef } from "react";

interface GiscusCommentsProps {
  className?: string;
}

export function GiscusComments({ className = "" }: GiscusCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Clear any existing children using DOM methods
    while (ref.current.firstChild) {
      ref.current.removeChild(ref.current.firstChild);
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "bioinfo/reachy");
    script.setAttribute("data-repo-id", "R_kgDOQrRJOA");
    script.setAttribute("data-category", "Blog Comments");
    script.setAttribute("data-category-id", "DIC_kwDOQrRJOM4C0H05");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "dark_dimmed");
    script.setAttribute("data-lang", "en");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;

    ref.current.appendChild(script);
  }, []);

  return (
    <div className={className}>
      <h3 className="text-lg font-mono font-medium text-[var(--text-primary)] mb-4">
        Comments
      </h3>
      <div ref={ref} className="giscus-container" />
    </div>
  );
}
