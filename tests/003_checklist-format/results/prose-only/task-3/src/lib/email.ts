// src/lib/email.ts

/**
 * Escapes user-derived strings before embedding them in HTML email templates.
 * (Security guideline 3.6 — Email Template HTML Injection Prevention)
 *
 * Trusted values (UUIDs, plan names, numbers) do not need escaping.
 * Free-text fields (display names, team names entered by users) must always
 * pass through this function.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
