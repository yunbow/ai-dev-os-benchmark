import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";

export interface AuthenticatedSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown[]
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function apiPaginated<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
): NextResponse {
  return NextResponse.json({ data, nextCursor, hasMore });
}

export function handleZodError(error: ZodError): NextResponse {
  return apiError(400, "VALIDATION_ERROR", "Validation failed", error.issues);
}

export async function getSession(): Promise<AuthenticatedSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AuthenticatedSession;
}

export type RouteHandler = (
  req: NextRequest,
  session: AuthenticatedSession,
  params?: Record<string, string>
) => Promise<NextResponse | Response>;

export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse | Response> => {
    const session = await getSession();
    if (!session) {
      return apiError(401, "UNAUTHORIZED", "Authentication required");
    }

    const params = context?.params ? await context.params : undefined;
    return handler(req, session, params);
  };
}

export function parseQueryParams<T extends Record<string, unknown>>(
  url: string,
  keys: string[]
): Partial<T> {
  const { searchParams } = new URL(url);
  const result: Record<string, string> = {};
  for (const key of keys) {
    const val = searchParams.get(key);
    if (val !== null) result[key] = val;
  }
  return result as Partial<T>;
}
