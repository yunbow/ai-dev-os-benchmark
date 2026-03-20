import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "No date";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "No date";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return d < new Date();
}

// Sanitize hex color to prevent XSS - only allow valid 6-digit hex
export function sanitizeHexColor(color: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  return "#6366f1"; // fallback to default
}

export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
