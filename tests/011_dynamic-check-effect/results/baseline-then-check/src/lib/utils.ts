import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

/**
 * Safely sanitize a hex color value for use in inline styles.
 * Returns a fallback if the value is not a valid 6-digit hex color.
 */
export function sanitizeHexColor(value: string, fallback = "#6b7280"): string {
  return isHexColor(value) ? value : fallback;
}
