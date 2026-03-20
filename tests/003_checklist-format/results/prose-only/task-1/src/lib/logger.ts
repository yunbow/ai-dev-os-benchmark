/**
 * Minimal structured logger.
 * In production, swap this for Pino / Winston and pipe to Sentry / CloudWatch
 * as required by Section 12 (Security Monitoring and Response).
 *
 * Log levels used for security events:
 *   warn  – authentication failures, authorization failures (IDOR), validation errors
 *   error – unexpected errors, CRITICAL security events
 */

type LogContext = Record<string, unknown>;

function log(level: "info" | "warn" | "error", ctx: LogContext, msg: string) {
  const entry = JSON.stringify({ level, msg, ...ctx, ts: new Date().toISOString() });
  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  info:  (ctx: LogContext, msg: string) => log("info",  ctx, msg),
  warn:  (ctx: LogContext, msg: string) => log("warn",  ctx, msg),
  error: (ctx: LogContext, msg: string) => log("error", ctx, msg),
};
