# AI Dev OS Check & Fix Report

**Date:** 2026-04-01
**Model:** claude-sonnet-4-6

---

## Scope

- **Mode:** Check & Fix
- **Target:** untracked source files (no commit history — all files are new)
- **Files checked:** 5
  - `src/app/api/tasks/route.ts`
  - `src/app/api/tasks/[id]/route.ts`
  - `src/features/tasks/schema/index.ts`
  - `src/lib/db/index.ts`
  - `src/lib/db/schema.ts`

---

## Summary

- ✅ Passed: 3 / 🔧 Fixed: 2 / ⚠️ Manual Review: 3

---

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/features/tasks/schema/index.ts` | 9 | validation.md §2 | Added `.refine()` to `dueDate` to reject past dates |
| 2 | `src/app/api/tasks/[id]/route.ts` | 13, 25, 63 | nextjs checklist: dynamic route param validation | Added UUID format check for `id` in all handlers (GET/PUT/DELETE) |

### Fix 1: dueDate future date validation

**Before:**
```ts
dueDate: z.string().datetime({ offset: true }).optional(),
```

**After:**
```ts
dueDate: z.string().datetime({ offset: true }).optional().refine(
  (val) => val === undefined || new Date(val) > new Date(),
  { message: 'dueDate must be in the future' },
),
```

**Guideline:** validation.md §2 — "MUST validate that future-facing dates (e.g., `dueDate`, `expiresAt`) are in the future using `.refine()`"

---

### Fix 2: Route param `id` UUID validation

**Before:**
```ts
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const rows = await db.select().from(tasks).where(eq(tasks.id, id))
```

**After:**
```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const rows = await db.select().from(tasks).where(eq(tasks.id, id))
```

Applied to all handlers: GET, PUT, DELETE.

**Guideline:** Next.js checklist — "Dynamic route parameters have validation"

---

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/app/api/tasks/*.ts` | — | security.md §3 Authorization | No auth check in any Route Handler — requires auth library decision (e.g. NextAuth, Clerk) and ownership model design |
| 2 | `src/app/api/tasks/*.ts` | — | security.md §3.2 Rate Limiting | No rate limiting on POST/PUT/DELETE — requires Edge Middleware or API Gateway setup |
| 3 | `src/app/api/tasks/*.ts` | — | security.md §2 CSRF Prevention | No Origin/Referer check on state-changing routes — evaluate if API is public or browser-only to determine CSRF requirements |

---

## Checklist Coverage

- Items checked: 12 / 12 (N/A items excluded)
- Pass rate: **83%** (after fixes)

---

## Guidelines Referenced

- `docs/ai-dev-os/03_guidelines/common/security.md`
- `docs/ai-dev-os/03_guidelines/common/validation.md`
- `.claude/skills/ai-dev-os-check/checklist-templates/nextjs.md`
