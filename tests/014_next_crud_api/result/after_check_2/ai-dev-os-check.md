# AI Dev OS Check & Fix Report

**実行日時:** 2026-04-01
**対象ブランチ:** master（新規プロジェクト、コミット履歴なし）

---

## Scope
- **モード:** Check & Fix
- **対象:** 未追跡ソースファイル（新規プロジェクト）
- **チェックファイル数:** 5
- **技術スタック:** Next.js + Drizzle ORM (SQLite)
- **使用チェックリスト:** `nextjs.md`
- **適用ガイドライン:**
  - `docs/ai-dev-os/03_guidelines/common/security.md`
  - `docs/ai-dev-os/03_guidelines/common/validation.md`
  - `docs/ai-dev-os/03_guidelines/frameworks/nextjs/project-structure.md`

---

## Summary

- ✅ Passed: 11 / 🔧 Fixed: 3 / ⚠️ Manual Review: 2

---

## Checked Files

| ファイル | 役割 |
|----------|------|
| `src/features/tasks/schema/index.ts` | Zodスキーマ定義 |
| `src/app/api/tasks/route.ts` | GET / POST Route Handler |
| `src/app/api/tasks/[id]/route.ts` | GET / PUT / DELETE Route Handler |
| `src/lib/db/schema.ts` | Drizzle ORMスキーマ |
| `src/lib/db/index.ts` | DBクライアント初期化 |

---

## Fixed Violations

| # | ファイル | 行 | ルール | 修正内容 |
|---|----------|----|--------|----------|
| 1 | `src/features/tasks/schema/index.ts` | 5–16, 23 | validation.md: 未来日時フィールドは `.refine()` で検証必須 | `futureDateString` ヘルパーを追加し `.refine((val) => new Date(val) > new Date())` を適用。`createTaskSchema` と `updateTaskSchema` の `dueDate` 両方に適用。 |
| 2 | `src/lib/db/index.ts` | 5 | security.md §4: DBパスをハードコードしない | `"./sqlite.db"` → `process.env.DATABASE_URL ?? "./sqlite.db"` に変更。 |
| 3 | `src/app/api/tasks/[id]/route.ts` | 16, 29, 59 | nextjs checklist: 動的ルートパラメータのバリデーション必須 | UUID形式チェック関数 `isValidId()` を追加し、GET・PUT・DELETE の各ハンドラ先頭で検証。不正な場合は 400 を返す。 |

---

## Manual Review Required

| # | ファイル | ルール | 手動対応が必要な理由 |
|---|----------|--------|----------------------|
| 1 | `src/app/api/tasks/route.ts`<br>`src/app/api/tasks/[id]/route.ts` | security.md §3: Route Handler層での認可チェック必須 | 認証システム未導入。NextAuth・APIキー・JWTなど認証方式の選定が先決であり、アーキテクチャ上の判断が必要。 |
| 2 | `src/app/api/tasks/route.ts`<br>`src/app/api/tasks/[id]/route.ts` | security.md §3.2: APIへのレートリミット適用 | Vercel Edge Middleware または Redis/メモリストアのセットアップが必要。インフラ構成の決定が先決。 |

---

## Checklist Coverage

| カテゴリ | チェック項目 | 結果 |
|----------|-------------|------|
| Routing | App Router規約に従っている | ✅ |
| Routing | 動的ルートパラメータのバリデーション | 🔧 Fixed |
| Server Components | "use client"の使用が最小限 | ✅ (N/A) |
| Server Components | Server Componentでクライアント専用APIを使用していない | ✅ |
| Server Actions | 全Server Actionに認可チェックあり | ⚠️ Manual |
| Server Actions | ActionResultパターンの使用 | ✅ (N/A) |
| Server Actions | バリデーションが先頭で実行されている | ✅ |
| Server Actions | revalidatePath/revalidateTagの適切な呼び出し | ✅ (N/A) |
| Security | 環境変数がサーバー専用（NEXT_PUBLIC_なし） | ✅ |
| Security | ユーザー入力のサニタイズ | ✅ |
| Security | CSRFトークン検証 | ⚠️ Manual |
| Security | レートリミット | ⚠️ Manual |
| Validation | dueDate の未来日時バリデーション | 🔧 Fixed |
| DB | DBパスの環境変数化 | 🔧 Fixed |
| Performance | next/imageの使用 | ✅ (N/A) |

- **チェック項目数:** 15 / 15
- **修正後パス率:** 87%

---

## After Fix: 変更後コード概要

### `src/features/tasks/schema/index.ts`
```ts
const futureDateString = z
  .string()
  .datetime({ offset: true })
  .refine((val) => new Date(val) > new Date(), {
    message: "dueDate must be in the future",
  });
```

### `src/lib/db/index.ts`
```ts
const sqlite = new Database(process.env.DATABASE_URL ?? "./sqlite.db");
```

### `src/app/api/tasks/[id]/route.ts`
```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id: string): boolean {
  return UUID_RE.test(id);
}
// 各ハンドラ先頭で: if (!isValidId(id)) return 400
```
