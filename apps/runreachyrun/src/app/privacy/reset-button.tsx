"use client";

export function ResetCookieButton() {
  const handleReset = () => {
    localStorage.removeItem("cookie-consent");
    window.location.reload();
  };

  return (
    <button
      onClick={handleReset}
      className="px-4 py-2 text-sm font-medium border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)] transition-colors"
    >
      Reset Cookie Preference
    </button>
  );
}
