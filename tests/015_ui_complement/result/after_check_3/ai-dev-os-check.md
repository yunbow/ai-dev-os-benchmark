# AI Dev OS Check & Fix Report

**Date:** 2026-04-01
**Model:** claude-sonnet-4-6

---

### Scope
- Mode: Check & Fix
- Target: untracked files (`src/`)
- Files checked: 10

### Summary
- ✅ Passed: 8 / 🔧 Fixed: 2 / ⚠️ Manual Review: 1

---

### Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/features/tasks/server/actions.ts` | 25 | Server Actions: revalidatePath | `revalidatePath("/dashboard/tasks")` を成功時に追加。タスク作成後にタスク一覧が更新されるよう修正。 |
| 2 | `src/app/(protected)/dashboard/tasks/error.tsx` | 12 | Security §3.7: エラーページ情報漏洩防止 | `console.error(error)` → `console.error(error.digest)` に変更。スタックトレースがブラウザの DevTools に露出しないよう修正。 |

---

### Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/features/tasks/server/actions.ts` | 8 | Server Actions: auth check | `createTaskAction` に認証チェック (`auth()`) がない。どの認証ライブラリ (NextAuth, Clerk 等) を使うかはプロジェクトのアーキテクチャ決定が必要なため自動修正不可。下記パターンで実装すること。 |

**実装例（Manual Review #1）:**

```ts
// createTaskAction の先頭に追加
const session = await auth();
if (!session?.user) {
  return {
    success: false,
    error: { code: "UNAUTHORIZED", message: "認証が必要です" },
  };
}
```

---

### Checklist Coverage

| Category | Items | Pass |
|----------|-------|------|
| Routing | 2 | 2 |
| Server Components / Client Components | 3 | 3 |
| Server Actions | 4 | 3 (1 manual review) |
| Security | 3 | 3 |
| Performance | 3 | 3 |
| Validation (security.md / validation.md) | 1 | 1 |

- Items checked: 16 / 16
- Pass rate: 94% (after fixes)

---

### Guidelines Referenced
- `docs/ai-dev-os/03_guidelines/common/security.md`
- `docs/ai-dev-os/03_guidelines/common/validation.md`
- `.claude/skills/ai-dev-os-check/checklist-templates/nextjs.md`
