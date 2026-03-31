# AI Dev OS Check & Fix Report

**Date**: 2026-04-01
**Model**: claude-sonnet-4-6

---

## Scope

- **Mode**: Check & Fix
- **Target**: Untracked source files (new project, no committed history)
- **Stack**: Next.js + Drizzle ORM + SQLite (better-sqlite3) + Zod
- **Files checked**: 6
  - `src/app/api/tasks/route.ts`
  - `src/app/api/tasks/[id]/route.ts`
  - `src/features/tasks/service.ts`
  - `src/features/tasks/schema.ts`
  - `src/lib/db/schema.ts`
  - `src/lib/db/index.ts`

---

## Summary

- ✅ Passed: 3 / 🔧 Fixed: 3 / ⚠️ Manual Review: 2

---

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/lib/db/index.ts` | 5 | security.md §4 | Hardcoded `"./local.db"` → `process.env.DATABASE_URL ?? "./local.db"` |
| 2 | `src/features/tasks/schema.ts` | 19-23 | validation.md §2 | `updateTaskSchema.dueDate` missing `.refine()` future-date check — added to match `createTaskSchema` |
| 3 | `src/app/api/tasks/route.ts` + `[id]/route.ts` | multiple | api.md §8 | Error responses changed from `{ error: "..." }` to `{ error: { code, message } }` standard format |

### Fix Details

#### Fix 1 — DB path via environment variable

```ts
// Before
const sqlite = new Database("./local.db");

// After
const sqlite = new Database(process.env.DATABASE_URL ?? "./local.db");
```

#### Fix 2 — Future-date validation on update schema

```ts
// Before (updateTaskSchema)
dueDate: z.string().datetime({ offset: true }).optional(),

// After
dueDate: z
  .string()
  .datetime({ offset: true })
  .refine((d) => new Date(d) > new Date(), {
    message: "dueDate must be in the future",
  })
  .optional(),
```

#### Fix 3 — Standardized error response format

```ts
// Before
{ error: "Validation failed", details: parsed.error.flatten() }
{ error: "Invalid id" }
{ error: "Not found" }

// After
{ error: { code: "BAD_REQUEST", message: "Validation failed", details: parsed.error.flatten() } }
{ error: { code: "BAD_REQUEST", message: "Invalid id" } }
{ error: { code: "NOT_FOUND", message: "Not found" } }
```

---

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/app/api/tasks/route.ts`, `[id]/route.ts` | all handlers | api.md §7.1, security.md §3 | No `auth()` check on any endpoint — all CRUD operations are publicly accessible. Requires architectural decision on auth strategy (NextAuth, session, API key, etc.) |
| 2 | `src/app/api/tasks/route.ts`, `[id]/route.ts` | all handlers | api.md §6 | Missing security headers (`X-Content-Type-Options: nosniff`, `Access-Control-Allow-Origin`). Recommend adding via `next.config.ts` with your specific domain allowlist |

### Manual Review Details

#### Manual 1 — Authentication on Route Handlers

All endpoints (`GET /api/tasks`, `POST /api/tasks`, `GET/PUT/DELETE /api/tasks/[id]`) are publicly accessible with no authentication. Per `api.md §7.1`:

```ts
// Recommended pattern
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
    { status: 401 }
  );
  // ...
}
```

#### Manual 2 — Security Headers

Route Handlers are missing required security headers per `api.md §6`. Recommended approach via `next.config.ts`:

```ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Access-Control-Allow-Origin", value: "https://your-domain.com" },
        ],
      },
    ];
  },
};
```

---

## Checklist Coverage

| Category | Items | Result |
|----------|-------|--------|
| Routing — App Router conventions | ✅ | Pass |
| Routing — Dynamic route param validation | ✅ | Pass (`parseId()` in `[id]/route.ts`) |
| Security — Env vars server-only | ✅ | Pass (no `NEXT_PUBLIC_` misuse) |
| Security — Input sanitized (Zod) | ✅ | Pass |
| Security — Auth check | ⚠️ | Manual review |
| Security — CORS / Security headers | ⚠️ | Manual review |
| Validation — Zod used | ✅ | Pass |
| Validation — Future-date `.refine()` | 🔧 | Fixed (updateTaskSchema) |
| Validation — DB path via env | 🔧 | Fixed |
| API — Error response format | 🔧 | Fixed |

- **Items checked**: 10 / 10
- **Pass rate**: 80% (after fixes) — 8/10 pass, 2 require manual action
