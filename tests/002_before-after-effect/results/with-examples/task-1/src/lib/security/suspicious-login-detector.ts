import { prisma } from "@/lib/prisma";

export interface SuspiciousLoginResult {
  isSuspicious: boolean;
  reasons: string[];
  currentCountry: string | null;
  knownCountries: string[];
}

export async function detectSuspiciousLogin(params: {
  userId: string;
  currentCountry: string | null;
}): Promise<SuspiciousLoginResult> {
  try {
    const { userId, currentCountry } = params;

    // First login is not suspicious
    const historyCount = await prisma.loginHistory.count({
      where: { userId, success: true },
    });
    if (historyCount === 0) {
      return {
        isSuspicious: false,
        reasons: [],
        currentCountry,
        knownCountries: [],
      };
    }

    // Fetch successful logins from the past 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentHistory = await prisma.loginHistory.findMany({
      where: {
        userId,
        success: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { country: true },
    });

    const knownCountries = [
      ...new Set(
        recentHistory
          .map((h) => h.country)
          .filter((c): c is string => c !== null),
      ),
    ];

    const reasons: string[] = [];

    if (
      currentCountry !== null &&
      knownCountries.length > 0 &&
      !knownCountries.includes(currentCountry)
    ) {
      reasons.push(`Login from new country: ${currentCountry}`);
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
      currentCountry,
      knownCountries,
    };
  } catch {
    // Fail-safe: on error, assume "not suspicious" to avoid blocking legitimate users
    return {
      isSuspicious: false,
      reasons: [],
      currentCountry: params.currentCountry,
      knownCountries: [],
    };
  }
}
