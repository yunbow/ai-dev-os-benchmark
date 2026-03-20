import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function sanitizeHexColor(color: string): string {
  // Only allow valid 6-digit hex colors
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  return "#6B7280"; // Default gray
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 1) return `${days} days ago`;
  if (days === 1) return "yesterday";
  if (hours > 1) return `${hours} hours ago`;
  if (hours === 1) return "1 hour ago";
  if (minutes > 1) return `${minutes} minutes ago`;
  return "just now";
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function priorityOrder(priority: string): number {
  const order: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return order[priority] ?? 0;
}
