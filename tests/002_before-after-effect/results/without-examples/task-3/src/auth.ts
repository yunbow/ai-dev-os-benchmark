import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Validate input with Zod (never trust raw input)
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // IP-based rate limiting (brute force protection)
        const ip =
          req.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          req.headers?.get("x-real-ip") ??
          "unknown";

        const rateLimitResult = await checkRateLimit(`login:${ip}`, {
          limit: 10,
          windowMs: 60 * 1000, // 10 attempts per minute (auth preset)
        });

        if (!rateLimitResult.allowed) {
          // Do NOT reveal why — just refuse
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
          },
        });

        // Constant-time path: always run bcrypt to prevent timing attacks
        const dummyHash =
          "$2b$12$invalidhashpaddingtomatchbcryptlengthxxxxxxxxxxxxxxxxxxxxxx";
        const passwordToCheck = user?.passwordHash ?? dummyHash;
        const isValid = await bcrypt.compare(password, passwordToCheck);

        if (!user || !isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
