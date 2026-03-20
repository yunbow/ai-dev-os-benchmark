import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiInternalError,
} from "@/lib/api-response";
import {
  authRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getIdentifier(request, "register");
  const rateLimitResult = authRateLimiter.check(identifier);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.resetTime);
  }

  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return apiError(
        "EMAIL_TAKEN",
        "An account with this email already exists",
        409
      );
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        message: "Account created successfully",
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiInternalError();
  }
}
