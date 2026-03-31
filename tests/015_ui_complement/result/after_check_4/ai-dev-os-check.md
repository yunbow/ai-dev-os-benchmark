# AI Dev OS Check & Fix Report

- Date: 2026-04-01
- Mode: Check & Fix
- Target: staged source files (`src/`)
- Files checked: 8

## Summary
- ✅ Passed: 5 / 🔧 Fixed: 2 / ⚠️ Manual Review: 1

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/features/tasks/server/actions.ts` | 35 | Server Actions › revalidatePath | Added `revalidatePath("/dashboard/tasks")` after task creation; also added `import { revalidatePath } from "next/cache"` |
| 2 | `src/app/dashboard/tasks/error.tsx` | 13 | Security 3.7 › Error page info leakage | Changed `console.error(error)` → `console.error(error.digest)` to avoid leaking stack traces to the browser console |

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/features/tasks/server/actions.ts` | 9–35 | Server Actions › auth check | Neither `getTasks()` nor `createTask()` calls `auth()`. Adding it requires an auth library (e.g., NextAuth `auth()`, Clerk `currentUser()`) which is not yet set up in this minimal scaffold. Add an auth check at the top of both functions before any data access. |

## Checklist Coverage
- Items checked: 16 / 16
- Pass rate: 94% (after fixes)
