# AI Dev OS Check & Fix Report

**Date:** 2026-04-01
**Branch:** master
**Skill:** /ai-dev-os-check (staged changes)

---

## Scope

- **Mode:** Check & Fix
- **Target:** staged changes (`git diff --cached`)
- **Files checked:** 6

### Checked Files

- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/features/auth/schema/index.ts`
- `src/features/auth/types/index.ts`
- `src/lib/auth/jwt.ts`
- `src/middleware.ts`

### Guidelines Applied (from CLAUDE.md)

- `docs/ai-dev-os/03_guidelines/common/security.md`
- `docs/ai-dev-os/03_guidelines/common/validation.md`
- `docs/ai-dev-os/03_guidelines/frameworks/nextjs/project-structure.md`
- Checklist: `.claude/skills/ai-dev-os-check/checklist-templates/nextjs.md`

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Passed | 4 |
| 🔧 Fixed | 2 |
| ⚠️ Manual Review | 2 |

---

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/lib/auth/jwt.ts` | 4–6 | security: Never include secrets in code | Removed hardcoded fallback `"dev-secret-change-in-production"`. Now throws at module init if `ACCESS_TOKEN_SECRET` is unset (fail-fast). |
| 2 | `src/middleware.ts` | 24, 29 | security / routing: Redirects must target the login UI page | Changed redirect target from `/api/auth/login` (POST-only API endpoint) to `/login` (login UI page). Redirecting to a POST-only API route would return 405/404 for unauthenticated users. |

### Fix Details

#### Fix 1 — `src/lib/auth/jwt.ts`

```diff
- const secret = new TextEncoder().encode(
-   process.env.ACCESS_TOKEN_SECRET ?? "dev-secret-change-in-production"
- );
+ const rawSecret = process.env.ACCESS_TOKEN_SECRET;
+ if (!rawSecret) {
+   throw new Error("ACCESS_TOKEN_SECRET environment variable is required");
+ }
+ const secret = new TextEncoder().encode(rawSecret);
```

#### Fix 2 — `src/middleware.ts`

```diff
- return NextResponse.redirect(new URL("/api/auth/login", request.url));
+ return NextResponse.redirect(new URL("/login", request.url));
```
(両箇所 — token なし / payload なし の両ケース)

---

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/app/api/auth/login/route.ts` | 10 | security: Rate limiting MUST be applied to all auth endpoints | コメントで "implement with Vercel KV in production" と記載されているが未実装。Vercel KV / Upstash Redis などの外部依存が必要なため自動修正不可。 |
| 2 | `src/app/api/auth/register/route.ts` | 10 | security: Rate limiting MUST be applied to all auth endpoints | 同上。 |

### Manual Review 対応方針

`common/security.md` §3.2 に従い、以下を実装すること:

```ts
// 実装例（Upstash Redis + @upstash/ratelimit）
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 req/min
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await ratelimit.limit(`auth:login:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  // ... rest of handler
}
```

---

## Checklist Coverage

| Category | Result |
|---|---|
| Routing conventions (App Router) | ✅ Pass |
| Zod validation at input boundary | ✅ Pass |
| Types inferred from Zod (`z.infer`) | ✅ Pass |
| Environment variables server-only (no `NEXT_PUBLIC_`) | ✅ Pass |
| Cookie security flags (`httpOnly`, `secure`, `sameSite`) | ✅ Pass |
| No secrets hardcoded in source | 🔧 Fixed |
| Middleware redirects to correct URL | 🔧 Fixed |
| Project structure follows vertical slice rules | ✅ Pass |
| Rate limiting on auth routes | ⚠️ Manual |

- **Items checked:** 9 / 9
- **Pass rate:** 78% → **100%**（自動修正後、Manual Review 項目を除く）
