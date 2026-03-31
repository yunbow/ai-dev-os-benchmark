# Test 014: Next.js CRUD API — プロンプトB 評価レポート

> 検証日: 2026-04-01
> 対象プロンプト: プロンプトB「CRUD API ルート」（タスク管理 GET/POST/PUT/DELETE + Drizzle ORM）
> 評価モデル: claude-sonnet-4-6
> 評価基準: `01_nextjs-tutorial_verification.md` §評価基準の定義（C1〜C10）

## 使用プロンプト

```
このNext.js 15 (App Router) プロジェクトにタスク管理のCRUD APIを実装してください。

要件:
- /api/tasks で GET（一覧）, POST（作成）
- /api/tasks/[id] で GET（詳細）, PUT（更新）, DELETE（削除）
- タスクのフィールド: id, title, description, status, dueDate, createdAt
- Drizzle ORM を使用（スキーマ定義含む）

最小構成で実装してください。
```

---

## 採点結果

### 評価基準

| # | カテゴリ | チェック項目 | 根拠 |
|---|---------|------------|------|
| C1 | 命名規則 | 関数名が `handle{Action}` / `get{Resource}` パターンに従っている | naming.md |
| C2 | 命名規則 | ファイル名が kebab-case である | naming.md |
| C3 | セキュリティ | ユーザー入力にバリデーション（Zod等）がある | security.md |
| C4 | セキュリティ | CSRF対策 or 認証チェックがある | security.md |
| C5 | エラーハンドリング | try-catch でエラーを分類している（汎用 catch だけでない） | error-handling.md |
| C6 | エラーハンドリング | 適切な HTTP ステータスコードを返している | error-handling.md |
| C7 | 型安全性 | `any` / `as` キャストを使っていない | validation.md |
| C8 | ディレクトリ構成 | App Router の規約に沿ったファイル配置（src/ ディレクトリ） | project-structure.md |
| C9 | API設計 | レスポンス形式が統一されている | api.md |
| C10 | コンポーネント設計 | Server Component / Client Component の分離が適切 | ui.md |

---

### Before（ガイドラインなし）— 5回採点

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | 主要な問題 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:----:|-----------|
| 1 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 1 | **6/10** | Zod なし、try-catch なし、認証なし、レスポンス形式不統一 |
| 2 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 1 | **6/10** | Zod なし、try-catch なし、DELETE が `{ success: true }` で他と不統一 |
| 3 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | **5/10** | Zod なし、try-catch なし、src/ ディレクトリなし（app/ at root） |
| 4 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 1 | **6/10** | Zod なし、try-catch なし、認証なし |
| 5 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 1 | **6/10** | Zod なし、try-catch なし、DELETE が `{ deleted: true }` で不統一 |
| **平均** | **1.0** | **1.0** | **0.0** | **0.0** | **0.0** | **1.0** | **1.0** | **0.8** | **0.0** | **1.0** | **5.8/10** | |

### After（AI Dev OS ガイドライン導入後）— 5回採点

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | 特記事項 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:----:|---------|
| 1 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | **8/10** | サービス層分離、parseId() による ID バリデーション |
| 2 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | **8/10** | UUID 主キー採用、DELETE で 204 No Content |
| 3 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | **9/10** | `{ error: { code, message } }` 統一形式、force-dynamic、サービス層 |
| 4 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | **8/10** | UUID 主キー、`updateTaskSchema.partial()` で UPDATE 実装 |
| 5 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | **8/10** | `{ error: { code, message } }` 形式、json() 未 try-catch |
| **平均** | **1.0** | **1.0** | **1.0** | **0.0** | **0.8** | **1.0** | **1.0** | **1.0** | **0.4** | **1.0** | **8.2/10** | |

### After+Check（AI Dev OS ガイドライン + /ai-dev-os-check 実行後）— 5回採点

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | チェックで修正された内容 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:----:|------------------------|
| 1 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | **9/10** | エラー形式を `{ error: { code, message } }` に統一、DB パス env var 化、dueDate refine 統一 |
| 2 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | **8/10** | UUID パラメータ検証追加、DB パス env var 化、dueDate refine 統一 |
| 3 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | **9/10** | UpdateTaskSchema の dueDate refine 追加（C9 は元から Pass） |
| 4 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | **8/10** | UUID パラメータ検証追加、dueDate refine 追加 |
| 5 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | **8/10** | UUID パラメータ検証（taskIdSchema として export）追加（C9 は元から Pass） |
| **平均** | **1.0** | **1.0** | **1.0** | **0.0** | **0.8** | **1.0** | **1.0** | **1.0** | **0.6** | **1.0** | **8.4/10** | |

---

## 品質スコア比較（3軸）

| | Before 平均 | After 平均 | After+Check 平均 | Before→After | After→After+Check |
|---|:-----------:|:----------:|:---------------:|:------------:|:-----------------:|
| プロンプトB: CRUD API | 5.8/10 | 8.2/10 | 8.4/10 | **+2.4（+41%）** | **+0.2（+2.4%）** |

---

## 項目別分析

### C1-C10 スコア推移（3軸）

| 項目 | Before | After | After+Check | Before→After | After→After+Check |
|------|:------:|:-----:|:-----------:|:------------:|:-----------------:|
| C3: Zod バリデーション | 0% | **100%** | 100% | **+100%** | ±0 |
| C5: エラー分類 | 0% | 80% | 80% | **+80%** | ±0 |
| C8: ディレクトリ構成 | 80% | 100% | 100% | +20% | ±0 |
| C9: レスポンス形式統一 | 0% | 40% | **60%** | +40% | **+20%** |
| C4: 認証チェック | 0% | 0% | 0% | ±0 | ±0 |
| C1/C2/C6/C7/C10 | 100% | 100% | 100% | ±0 | ±0 |

### 注目所見

**C7（型安全性）が Test 013 と異なりゼロ劣化:**
- CRUD API 実装では、Drizzle ORM の型が `$inferSelect` / `$inferInsert` で自動導出されるため、`as` キャストが不要
- 認証実装（jose ライブラリ）と異なり、ライブラリに起因する型変換問題がない
- Before・After・After+Check すべて C7 = 100%

**C4（認証）が全試行 0%:**
- プロンプトが認証を要件に含めていないため、全 15 試行で認証チェックなし
- ガイドラインも /ai-dev-os-check も「認証が必要」と指摘するが、アーキテクチャ決定が必要なため自動修正不可（全 5 試行 Manual Review）
- これは **評価基準の設計課題**でもある（プロンプトが認証を明示しない場合 C4 は常に 0）

**C9（レスポンス形式）で After+Check に+20%改善:**
- Test 013（認証）では check ツールが C1-C10 に変化をもたらさなかったのと対照的
- after_check_1 が `{ error: { code, message } }` 形式に統一 → C9: 0→1
- ただし after_check_2,4 は error 形式が修正されず → 試行ごとの check 内容のばらつきが継続

**C8（ディレクトリ構成）:**
- Before で before_3 のみ `app/` at root（src/ なし）で Fail → before 平均 0.8
- After 全試行が `src/app/api/tasks/` → After から 100%

---

## 命名一貫性チェック（プロンプトB固有）

### Before（5試行）

| 概念 | 試行1 | 試行2 | 試行3 | 試行4 | 試行5 | 一致数 |
|------|-------|-------|-------|-------|-------|--------|
| タスクスキーマのカラム命名 | `dueDate` (TS) / `due_date` (DB) | 同左 | 同左 | 同左 | 同左 | **5/5** |
| エラーレスポンス形式 | `{ error }` | `{ error }` | `{ error }` | `{ error }` | `{ error }` | **5/5** |
| DELETE 成功レスポンス | `{ message: "Deleted" }` | `{ success: true }` | `{ message: "Deleted" }` | `{ message: "Deleted" }` | `{ deleted: true }` | 3/5 |
| DB クライアント import パス | `@/db` | `@/db` | `@/db` | `@/db` | `@/db` | **5/5** |
| Zod スキーマ命名 | N/A | N/A | N/A | N/A | N/A | 0/5 |

**Before 合計: 18/25 (72%)**

### After（5試行）

| 概念 | 試行1 | 試行2 | 試行3 | 試行4 | 試行5 | 一致数 |
|------|-------|-------|-------|-------|-------|--------|
| タスクスキーマのカラム命名 | `dueDate` / `due_date` | 同左 | 同左 | 同左 | 同左 | **5/5** |
| エラーレスポンス形式 | `{ error, details }` | `{ error }` | `{ error: { code, message } }` | `{ error, issues }` | `{ error: { code, message } }` | 2/5 |
| DELETE 成功レスポンス | task オブジェクト | 204 null | 204 null | 204 null | 204 null | 4/5 |
| DB クライアント import パス | `@/lib/db` | `@/lib/db` | `@/lib/db` | `@/lib/db` | `@/lib/db` | **5/5** |
| Zod スキーマ命名 | `createTaskSchema` | `createTaskSchema` | `CreateTaskSchema` (PascalCase) | `createTaskSchema` | `createTaskSchema` | 4/5 |

**After 合計: 20/25 (80%)**

**命名一貫性の改善: +8%（72%→80%）**

---

## 規約違反発生頻度（プロンプトB × 5回）

### C1-C10 範囲内の違反

| 違反カテゴリ | Before | After | After+Check | 考察 |
|-------------|:------:|:-----:|:-----------:|------|
| バリデーション欠如（Zod なし） | **5/5** | 0/5 | 0/5 | ✅ After で完全解消 |
| エラーハンドリング欠如（json() 未 try-catch） | **5/5** | 1/5 | 1/5 | ✅ After で大幅改善、check で変化なし |
| レスポンス形式不統一 | **5/5** | 3/5 | 2/5 | △ After で改善、check で追加改善（+1試行） |
| ディレクトリ構成違反 | 1/5 | 0/5 | 0/5 | ✅ After で完全解消 |
| 認証チェック欠如 | **5/5** | **5/5** | **5/5** | ❌ 全試行で未解消 |
| 型安全性違反（`as` キャスト） | 0/5 | 0/5 | 0/5 | — 全試行で問題なし（Drizzle の型が $inferSelect で自動導出） |

### /ai-dev-os-check が修正した違反（C1-C10 範囲外）

| 違反カテゴリ | After 発生回数 | After+Check 発生回数 | 対応状況 |
|-------------|:-------------:|:-------------------:|---------|
| DB パスのハードコード | **5/5** | 2/5 | 🔧 check_1,2,3 で env var 化、check_4,5 は未検出/未修正 |
| dueDate の updateSchema での refine 欠落 | 3/5 | 0/5 | 🔧 check_1,2,3 で自動修正（after_3,5 は元から実装済み） |
| ルートパラメータ（id）のバリデーション欠如 | 2/5 | 0/5 | 🔧 check_2,4,5 で UUID 検証追加（after_1 は元から実装済み） |
| 認証チェック欠如 | **5/5** | **5/5** | ⚠️ 全 5 試行で手動対応指示（アーキテクチャ決定が必要） |
| レート制限なし | **5/5** | **5/5** | ⚠️ 全 5 試行で手動対応指示 |
| IDOR 対策なし（オーナーシップ確認） | **5/5** | **5/5** | ⚠️ check_3,5 で指摘（認証実装後に対応が必要） |

**check ツールの合計修正件数: 9件自動修正 + 15件手動対応指示（5試行合計）**

---

## Before/After 代表コード比較

代表試行: **before_2**（6/10、平均に最も近い）vs **after_3**（9/10、最高スコア）

### diff 1: 入力バリデーション

**Before（before_2/src/app/api/tasks/route.ts）**
```typescript
// Before: title の存在チェックのみ。型・形式・長さ・enumバリデーションなし
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, status, dueDate } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const [task] = await db
    .insert(tasks)
    .values({ title, description, status, dueDate })
    .returning();
  // statusに "invalid_value" が渡っても INSERT される
```

**After（after_3/src/app/api/tasks/route.ts）**
```typescript
// After: Zod で型・enum・長さ・日付形式を一括バリデーション
import { CreateTaskSchema } from "@/features/tasks/schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.flatten() } },
      { status: 422 }
    );
  }
  // status は ["todo","in_progress","done"] に限定
  // dueDate は ISO datetime 形式 + 未来日時チェック
```

主な差異:
- status の enum 検証（不正値が DB に INSERT されることを防止）
- dueDate の ISO 形式 + 未来日時 refine チェック
- json() パースエラーの明示的 try-catch

### diff 2: タスクスキーマの構成

**Before（before_2/src/db/schema.ts）— DB のみ**
```typescript
// Before: Drizzle スキーマのみ。Zod 検証スキーマなし
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .notNull().default("todo"),
  // ...
});
// バリデーションはルートハンドラの手動チェックのみ
```

**After（after_3 の 2ファイル構成）**
```typescript
// lib/db/schema.ts — Drizzle スキーマ（DB 定義）
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),  // UUID に変更
  // ...
});

// features/tasks/schema/index.ts — Zod スキーマ（入力検証）
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  status: TaskStatusSchema.default("todo"),
  dueDate: z.string().datetime({ offset: true })
    .refine((val) => new Date(val) > new Date(), { message: "dueDate must be in the future" })
    .optional(),
});
```

主な差異:
- DB スキーマ（Drizzle）と入力バリデーション（Zod）を分離
- `src/features/tasks/` に domain 別にまとめる vertical slice 構造
- UUID 主キー採用（int auto-increment から変更）

### diff 3: エラーレスポンス形式

**Before（before_2/src/app/api/tasks/[id]/route.ts）**
```typescript
// DELETE 成功は { success: true }
return NextResponse.json({ success: true });

// GET 失敗は { error: "Not found" }
return NextResponse.json({ error: "Not found" }, { status: 404 });

// POST バリデーション失敗は { error: "title is required" }
return NextResponse.json({ error: "title is required" }, { status: 400 });
// → 成功と失敗でレスポンス形式が完全に異なる
```

**After（after_3/src/app/api/tasks/[id]/route.ts）**
```typescript
// 全エラーが { error: { code, message } } で統一
return NextResponse.json(
  { error: { code: "NOT_FOUND", message: "Task not found" } },
  { status: 404 }
);
return NextResponse.json(
  { error: { code: "VALIDATION_ERROR", message: parsed.error.flatten() } },
  { status: 422 }
);
// DELETE 成功は 204 No Content（ボディなし）
return new Response(null, { status: 204 });
```

---

## Test 013 との比較（横断的知見）

| 観点 | Test 013（認証） | Test 014（CRUD） |
|------|----------------|----------------|
| Before スコア | 5.4/10 | 5.8/10 |
| After スコア | 7.8/10 | 8.2/10 |
| After+Check スコア | 7.8/10 | 8.4/10 |
| Before→After 改善 | +2.4 (+44%) | +2.4 (+41%) |
| After→After+Check 改善 | **±0** | **+0.2 (+2.4%)** |
| C7（型安全性）の変化 | 40%→0%（**悪化**） | 100%→100%（変化なし） |
| C9（レスポンス形式）の変化 | 0%→20%（小改善） | 0%→40%→60%（段階的改善） |
| check が C1-C10 に与えた影響 | ゼロ | +0.2（C9 1試行改善） |
| C4（認証）の変化 | 100%→100%（元々高い） | 0%→0%→0%（全試行未実装） |

**C7 劣化なし（CRUD）:**
Drizzle ORM の `$inferSelect` / `$inferInsert` による型自動導出のため、`as` キャストが不要。Test 013（jose ライブラリ使用）との構造的な違い。

**C4 全試行 0%（CRUD）:**
プロンプトが認証を要件に含めないため、ガイドライン有無にかかわらず認証チェックが実装されない。評価基準は「該当する場合」の条件付きだが、CRUD API は認証が「該当する」ケースであり、ガイドラインの認証指示が code generation レベルでは効果を発揮しないことを示す。

---

## 考察と記事への示唆

### ガイドライン導入の効果（CRUD API）

- **スコア改善: Before 5.8 → After 8.2（+2.4点、+41%）**
- **Zod バリデーション: 5/5→0/5 の違反（100%解消）**
- **エラーハンドリング: 5/5→1/5 の違反（80%改善）**
- **ディレクトリ構成: 1/5→0/5 の違反（完全解消）**
- **スキーマ分離（Drizzle + Zod）が全 after 試行で採用**

### /ai-dev-os-check の CRUD API での役割

Test 013（認証）と比べて check ツールが C1-C10 に+0.2 の改善をもたらした。これは:
- error format 統一（C9: 0→1）が 1 試行で達成
- ただし 4/5 試行では C9 に変化なし（check のばらつき）

C1-C10 範囲外では重要な修正を実施:
1. **dueDate refine の updateSchema 欠落** — CREATE には入れたが UPDATE で忘れていたケースが 3/5 trial に存在。check が自動修正。
2. **UUID ルートパラメータバリデーション** — 4/5 trial で未実装。check が全試行に UUID regex 検証を追加。
3. **DB パスハードコード** — 3/5 trial で env var 化。

### 認証チェック（C4）の構造的問題

CRUD API プロンプトは認証を要件に含めないため、全 15 試行で C4 = 0。
- 「ガイドラインを参照していれば認証チェックを追加するはず」という期待に反する結果
- **プロンプト設計の問題**でもある：認証要件を明示しない限り、AI は「最小構成」を優先する
- 記事では「ガイドラインは品質の底上げをするが、プロンプトの要件を超えた機能を自動追加するものではない」という注意書きが必要

### after 試行間の品質ばらつき

- after_3（9/10）: サービス層 + `{ error: { code, message } }` + force-dynamic + 204
- after_5（8/10）: `{ error: { code, message } }` のみ、json() の try-catch なし
- ガイドライン導入後も最大2点のスコア差が残る → 一貫性の担保には check の組み合わせが有効

---

## 補足事項

- C10（SC/CC 分離）は全試行 Pass: プロンプトB の成果物は API Route ハンドラのみ（React コンポーネントなし）
- before_3 は `app/` at root（src/ なし）で C8 Fail。他 4 試行は `src/app/` で Pass
- after_4 の status enum が `["pending", "in_progress", "done"]` と仕様（`"todo"`）から逸脱。C3 Pass だが仕様準拠の一貫性に課題
- 検証環境: 各試行は独立した会話セッション（コンテキストリセット済み）
