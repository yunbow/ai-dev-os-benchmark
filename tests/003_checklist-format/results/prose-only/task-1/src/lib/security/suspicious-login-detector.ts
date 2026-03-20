/**
 * Suspicious login detection (Section 3.8).
 *
 * Compares the current login country against the past-30-day history.
 * Returns isSuspicious:true when the country is new.
 *
 * Rules:
 * - First login (no history) is NOT suspicious.
 * - Must be called asynchronously (fire-and-forget) so it never blocks the login flow.
 * - Errors must be caught by the caller; this function may throw.
 * - Country is derived from request headers: x-user-country / x-vercel-ip-country / cf-ipcountry.
 */

import prisma from "@/lib/prisma";
import { sendSuspiciousLoginEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export interface SuspiciousLoginParams {
  userId: string;
  currentCountry: string | null;
}

export interface SuspiciousLoginResult {
  isSuspicious: boolean;
  reasons: string[];
  currentCountry: string | null;
  knownCountries: string[];
}

const HISTORY_WINDOW_DAYS = 30;

export async function detectSuspiciousLogin(
  params: SuspiciousLoginParams
): Promise<SuspiciousLoginResult> {
  const { userId, currentCountry } = params;

  const since = new Date(Date.now() - HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Fetch distinct countries from recent successful logins
  const history = await prisma.loginHistory.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      success: true,
    },
    select: { country: true },
  });

  const knownCountries = [
    ...new Set(history.map((h) => h.country).filter(Boolean) as string[]),
  ];

  // First login: no history → not suspicious
  if (knownCountries.length === 0) {
    return { isSuspicious: false, reasons: [], currentCountry, knownCountries };
  }

  const reasons: string[] = [];

  if (currentCountry && !knownCountries.includes(currentCountry)) {
    reasons.push(`Login from new country: ${currentCountry}`);
  }

  const isSuspicious = reasons.length > 0;

  if (isSuspicious) {
    logger.warn({ userId, currentCountry, knownCountries, reasons }, "Suspicious login detected");

    // Async email notification — do not await here (caller is already fire-and-forget)
    sendSuspiciousLoginEmail({ userId, currentCountry, reasons }).catch((err) => {
      logger.error({ err, userId }, "Failed to send suspicious login email");
    });
  }

  return { isSuspicious, reasons, currentCountry, knownCountries };
}
