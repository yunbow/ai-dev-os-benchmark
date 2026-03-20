import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function apiPaginated<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
) {
  return NextResponse.json({ data, nextCursor, hasMore });
}
