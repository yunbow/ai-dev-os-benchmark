import { prisma } from "@/lib/prisma";
import { sendSuspiciousLoginEmail } from "@/lib/email";

interface SuspiciousLoginParams {
  userId: string;
  currentCountry: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function detectSuspiciousLogin(
  params: SuspiciousLoginParams,
): Promise<boolean> {
  const { userId, currentCountry, ipAddress, userAgent } = params;

  // Get recent successful login history (last 10)
  const recentLogins = await prisma.loginHistory.findMany({
    where: {
      userId,
      success: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  let isSuspicious = false;
  const reasons: string[] = [];

  // Check for new country
  if (currentCountry && recentLogins.length > 0) {
    const knownCountries = new Set(
      recentLogins
        .map((l) => l.country)
        .filter((c): c is string => c !== null),
    );

    if (!knownCountries.has(currentCountry) && knownCountries.size > 0) {
      isSuspicious = true;
      reasons.push(`Login from new country: ${currentCountry}`);
    }
  }

  // Check for new IP address (for first-time IPs after established history)
  if (ipAddress && recentLogins.length >= 3) {
    const knownIps = new Set(
      recentLogins
        .map((l) => l.ipAddress)
        .filter((ip): ip is string => ip !== null),
    );

    if (!knownIps.has(ipAddress)) {
      isSuspicious = true;
      reasons.push(`Login from new IP address`);
    }
  }

  // Check for rapid successive logins from different locations
  const recentHourLogins = recentLogins.filter((l) => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return l.createdAt > hourAgo;
  });

  if (recentHourLogins.length >= 3) {
    const countries = new Set(
      recentHourLogins
        .map((l) => l.country)
        .filter((c): c is string => c !== null),
    );
    if (countries.size >= 2) {
      isSuspicious = true;
      reasons.push("Multiple logins from different countries within an hour");
    }
  }

  // Check for failed login attempts before this success
  const recentFailures = await prisma.loginHistory.count({
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
  });

  if (recentFailures >= 3) {
    isSuspicious = true;
    reasons.push(
      `${recentFailures} failed login attempts in the last 15 minutes`,
    );
  }

  // If suspicious, send alert email
  if (isSuspicious) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user) {
      try {
        await sendSuspiciousLoginEmail({
          email: user.email,
          name: user.name ?? user.email,
          country: currentCountry,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          reasons,
        });
      } catch {
        // Don't fail login if email fails
        console.error("Failed to send suspicious login email");
      }
    }
  }

  return isSuspicious;
}

// Check failed attempts for TOTP lockout
export async function checkTotpLockout(userId: string): Promise<{
  locked: boolean;
  unlocksAt?: Date;
}> {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);

  const failedAttempts = await prisma.loginHistory.count({
    where: {
      userId,
      success: false,
      createdAt: { gte: windowStart },
    },
  });

  if (failedAttempts >= 5) {
    const lastFailure = await prisma.loginHistory.findFirst({
      where: { userId, success: false },
      orderBy: { createdAt: "desc" },
    });

    if (lastFailure) {
      const unlocksAt = new Date(lastFailure.createdAt.getTime() + 15 * 60 * 1000);
      return { locked: true, unlocksAt };
    }
  }

  return { locked: false };
}

// Check max concurrent sessions
export async function enforceMaxSessions(userId: string): Promise<void> {
  const MAX_SESSIONS = 5;

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" },
  });

  if (sessions.length >= MAX_SESSIONS) {
    // Delete oldest sessions to maintain max
    const toDelete = sessions.slice(0, sessions.length - MAX_SESSIONS + 1);
    await prisma.session.deleteMany({
      where: {
        id: { in: toDelete.map((s) => s.id) },
      },
    });
  }
}
