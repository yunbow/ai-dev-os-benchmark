# AI Dev OS Check & Fix Report

**実行日時:** 2026-04-01
**実行コマンド:** `/ai-dev-os-check`

---

## Scope
- **Mode:** Check & Fix
- **Target:** Untracked source files (`src/`, `drizzle.config.ts`)
- **Stack detected:** Next.js (App Router) + Drizzle ORM + SQLite
- **Files checked:** 7

### 対象ファイル一覧
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`
- `src/features/tasks/services/task-service.ts`
- `src/features/tasks/schema/index.ts`
- `src/lib/db/schema.ts`
- `src/lib/db/index.ts`
- `drizzle.config.ts`

---

## Summary
- ✅ Passed: 3 / 🔧 Fixed: 1 / ⚠️ Manual Review: 3

---

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/features/tasks/schema/index.ts` | 22–26 | validation.md §2 — MUST use `.refine()` for future-facing dates | `UpdateTaskSchema.dueDate` に `.refine((val) => new Date(val) > new Date())` を追加。`CreateTaskSchema` には存在していたが `UpdateTaskSchema` では欠落していた。 |

### 修正内容詳細

**Before:**
```typescript
export const UpdateTaskSchema = z.object({
  // ...
  dueDate: z
    .string()
    .datetime({ offset: true })
    .optional(),
});
```

**After:**
```typescript
export const UpdateTaskSchema = z.object({
  // ...
  dueDate: z
    .string()
    .datetime({ offset: true })
    .refine((val) => new Date(val) > new Date(), {
      message: "dueDate must be in the future",
    })
    .optional(),
});
```

---

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/app/api/tasks/[id]/route.ts` | 11–64 | security.md §3 — Authorization / IDOR prevention | 認証・オーナーシップチェックなし。任意の呼び出し元が ID でタスクを読み書き可能。認証レイヤーと `userId` スコープのクエリの追加が必要。 |
| 2 | `src/app/api/tasks/route.ts`, `[id]/route.ts` | — | security.md §3.2 — Rate limiting | いずれのルートにもレート制限なし。Vercel Edge Middleware による IP ベースの制限を推奨（プリセット: `api` → 100/min）。 |
| 3 | `src/app/api/tasks/route.ts`, `[id]/route.ts` | — | security.md §3.7 — Error information leakage | サービス層の例外（DB エラーなど）が catch されていない。未処理エラーがスタックトレース付きで 500 を返す可能性がある。サービス呼び出しを try/catch で囲み、汎用エラーレスポンスを返すよう修正が必要。 |

---

## Checklist Coverage

- Items checked: 18 / 18
- Pass rate: **83%**（fix 後: 15/18 pass、3 件はアーキテクチャレベルの対応が必要）

---

## 適用ガイドライン

| ガイドライン | 参照箇所 |
|---|---|
| `docs/ai-dev-os/03_guidelines/common/security.md` | §3 API/Route Handler Security, §3.2 Rate Limiting, §3.7 Error Page Information Leakage Prevention |
| `docs/ai-dev-os/03_guidelines/common/validation.md` | §2 Business Logic Rules in Zod Schemas |
| `docs/ai-dev-os/03_guidelines/frameworks/nextjs/project-structure.md` | §3 Vertical Slice Design, §5 Dependency Rules |
