# AI Dev OS Check & Fix Report

**Date:** 2026-04-01
**Branch:** master

---

## Scope
- **Mode:** Check & Fix
- **Target:** untracked / new files (`src/`)
- **Files checked:** 8
- **Stack detected:** Next.js (App Router)
- **Checklist:** `.claude/skills/ai-dev-os-check/checklist-templates/nextjs.md`
- **Guidelines:**
  - `docs/ai-dev-os/03_guidelines/common/security.md`
  - `docs/ai-dev-os/03_guidelines/common/validation.md`
  - `docs/ai-dev-os/03_guidelines/frameworks/nextjs/server-actions.md`

---

## Summary

| | Count |
|---|---|
| ✅ Passed | 10 |
| 🔧 Fixed | 2 |
| ⚠️ Manual Review | 2 |

---

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/features/tasks/server/actions.ts` | 9 | Server Actions: ActionResult pattern | `getTasks()` の戻り値を `Task[]` から `ActionResult<Task[]>` に変更。合わせて `src/app/dashboard/tasks/page.tsx` の呼び出し側も対応 |
| 2 | `src/features/tasks/server/actions.ts` | 36 | Server Actions: revalidatePath | `createTask()` のミューテーション後に `revalidatePath("/dashboard/tasks")` を追加。`next/cache` からのインポートも追加 |

---

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/features/tasks/server/actions.ts` | 10 | Server Actions: auth check (`auth()`) | `getTasks()` に認証ガードなし。auth ライブラリ（NextAuth.js 等）の選定・導入が必要なアーキテクチャ上の判断事項のため自動修正不可 |
| 2 | `src/features/tasks/server/actions.ts` | 14 | Server Actions: auth check (`auth()`) | `createTask()` に認証ガードなし。未認証ユーザーがタスクを作成可能な状態。同上の理由で自動修正不可 |

---

## Checklist Coverage

| Category | Items | Passed |
|---|---|---|
| Routing | 2 | 2 |
| Server Components / Client Components | 3 | 3 |
| Server Actions | 4 | 2 (+ 2 fixed) |
| Security | 3 | 3 |
| Performance | 3 | 3 (N/A items) |
| **Total** | **16** | **16** |

**Pass rate after fixes: 87.5%**
*(Remaining 2 items require manual auth implementation)*

---

## Files Checked

| File | Result |
|------|--------|
| `src/app/dashboard/tasks/page.tsx` | 🔧 Updated (getTasks return type 対応) |
| `src/app/dashboard/tasks/loading.tsx` | ✅ Pass |
| `src/app/dashboard/tasks/error.tsx` | ✅ Pass |
| `src/features/tasks/server/actions.ts` | 🔧 Fixed (revalidatePath + ActionResult) / ⚠️ auth check |
| `src/features/tasks/components/task-create-form.tsx` | ✅ Pass |
| `src/features/tasks/components/task-table.tsx` | ✅ Pass |
| `src/features/tasks/schema/task-schema.ts` | ✅ Pass |
| `src/features/tasks/types/index.ts` | ✅ Pass |
