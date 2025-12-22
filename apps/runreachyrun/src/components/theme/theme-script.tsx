"use client";

import { useEffect } from "react";

export function ThemeScript() {
  useEffect(() => {
    // This runs immediately on mount to set the correct theme
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []);

  return null;
}
