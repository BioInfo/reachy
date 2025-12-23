/**
 * Date utilities for consistent timezone handling
 *
 * Problem: new Date("2025-12-22") parses as UTC midnight,
 * which becomes Dec 21 in US timezones when displayed.
 *
 * Solution: Parse as local time to preserve the intended date.
 */

/**
 * Format a date string (YYYY-MM-DD) for display
 * Parses as local time to avoid timezone shift
 */
export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", options);
}

/**
 * Parse a date string as local time (not UTC)
 * Use this when you need a Date object for display
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
