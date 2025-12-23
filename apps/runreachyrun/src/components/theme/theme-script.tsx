"use client";

import { useEffect } from "react";

export function ThemeScript() {
  useEffect(() => {
    // This runs immediately on mount to set the correct theme
    // Default is always dark - user must explicitly choose light
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      // Default to dark (ignore system preference)
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}
