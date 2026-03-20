import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import {
  detectSuspiciousLogin,
  enforceMaxSessions,
  checkTotpLockout,
} from "@/lib/security/suspicious-login-detector";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            emailVerified: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Check account lockout
        const lockout = await checkTotpLockout(user.id);
        if (lockout.locked) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        // Get IP and user agent from request headers
        const ipAddress =
          (request as Request)?.headers?.get("x-forwarded-for")?.split(",")[0].trim() ??
          (request as Request)?.headers?.get("x-real-ip") ??
          null;
        const userAgent =
          (request as Request)?.headers?.get("user-agent") ?? null;

        // Record login history
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            success: passwordMatch,
            ipAddress,
            userAgent,
            country: null,
          },
        });

        if (!passwordMatch) {
          return null;
        }

        // Enforce max 5 concurrent sessions
        await enforceMaxSessions(user.id);

        // Detect suspicious login (async, don't block login)
        detectSuspiciousLogin({
          userId: user.id,
          currentCountry: null,
          ipAddress,
          userAgent,
        }).catch(() => {
          // Don't fail login if detection fails
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user }) {
      return !!user;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
