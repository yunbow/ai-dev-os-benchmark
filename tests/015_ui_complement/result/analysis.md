# プロンプトC: UIコンポーネント — 評価レポート

## プロンプト

```
このNext.js 15 (App Router) プロジェクトにタスク一覧画面を実装してください。

要件:
- /dashboard/tasks ページ
- タスク一覧テーブル（Server Component でデータ取得）
- タスク作成フォーム（Client Component）
- フォームバリデーション
- ローディング・エラー状態の表示

最小構成で実装してください。
```

---

## 評価基準

| # | カテゴリ | チェック項目 |
|---|---------|------------|
| C1 | 命名規則 | 関数名が `handle{Action}` / `get{Resource}` パターンに従っている |
| C2 | 命名規則 | ファイル名が kebab-case である |
| C3 | セキュリティ | ユーザー入力にバリデーション（Zod等）がある |
| C4 | セキュリティ | CSRF対策 or 認証チェックがある（該当する場合） |
| C5 | エラーハンドリング | try-catch でエラーを分類している（汎用 catch だけでない） |
| C6 | エラーハンドリング | 適切な HTTP ステータスコードを返している（UI = N/A → PASS） |
| C7 | 型安全性 | `any` / `as` キャストを使っていない |
| C8 | ディレクトリ構成 | App Router の規約に沿ったファイル配置 |
| C9 | API設計 | レスポンス形式が統一されている（例: ActionResult パターン） |
| C10 | コンポーネント設計 | Server Component / Client Component の分離が適切 |

> **C6 補足**: UIコンポーネントはHTTPレスポンスを返さないため、C6は常にN/A扱いでPASS(1)とする。

---

## Before スコア（ガイドラインなし、5回）

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | 備考 |
|------|----|----|----|----|----|----|----|----|----|----|------|------|
| before_1 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 1 | **5** | `TaskForm.tsx`（PascalCase）、`as string` キャスト |
| before_2 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 1 | **5** | before_1 と同一コード |
| before_3 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 1 | **5** | Server Actions使用(CSRF○)、`app/`ルート（no src/）、`as string | null` |
| before_4 | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | **8** | 全体的に高品質（outlier）、kebab-case、instanceof Error |
| before_5 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 1 | **5** | before_1 と同一コード |
| **平均** | **1.0** | **0.2** | **0.0** | **0.2** | **0.2** | **1.0** | **0.2** | **0.8** | **1.0** | **1.0** | **5.6** | |

## After スコア（ガイドライン導入後、5回）

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | 備考 |
|------|----|----|----|----|----|----|----|----|----|----|------|------|
| after_1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | `as Record<string,string[]>`、revalidatePath 欠落 |
| after_2 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | `as Record<string,string[]>`、revalidatePath あり |
| after_3 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | **8** | `TaskCreateForm.tsx`（PascalCase）、try-catch○、revalidatePath 欠落 |
| after_4 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | `as Record<string,string[]>`、revalidatePath 欠落 |
| after_5 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | `as Record<string,string[]>`、revalidatePath 欠落 |
| **平均** | **1.0** | **0.8** | **1.0** | **1.0** | **0.2** | **1.0** | **0.0** | **1.0** | **1.0** | **1.0** | **8.0** | |

## After+Check スコア（ガイドライン + /ai-dev-os-check、5回）

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | 備考 |
|------|----|----|----|----|----|----|----|----|----|----|------|------|
| check_1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | revalidatePath 追加済 |
| check_2 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | after_2 から変更なし（元から正しい） |
| check_3 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | **8** | revalidatePath 追加済、PascalCase 残存 |
| check_4 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | **8** | revalidatePath 追加済 |
| check_5 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | **8** | `as` キャスト解消済(C7○)、PascalCase 残存(C2✗)、inline styles |
| **平均** | **1.0** | **0.6** | **1.0** | **1.0** | **0.2** | **1.0** | **0.2** | **1.0** | **1.0** | **1.0** | **8.0** | |

---

## 3軸比較

| 条件 | スコア | Before比 | After比 |
|------|:------:|:--------:|:-------:|
| Before（ガイドラインなし） | **5.6/10** | — | — |
| After（CLAUDE.md導入） | **8.0/10** | +2.4（+43%） | — |
| After+Check（+ai-dev-os-check） | **8.0/10** | +2.4（+43%） | ±0（0%） |

### 項目別平均スコア比較

| 項目 | Before | After | After+Check | 変化 |
|------|:------:|:-----:|:-----------:|:----:|
| C1 命名規則（関数） | 1.0 | 1.0 | 1.0 | 不変 |
| C2 命名規則（ファイル） | 0.2 | 0.8 | 0.6 | **↑大** / ↓小（残存問題あり） |
| C3 Zodバリデーション | 0.0 | 1.0 | 1.0 | **↑完全改善** |
| C4 CSRF/Server Actions | 0.2 | 1.0 | 1.0 | **↑完全改善** |
| C5 エラー分類 | 0.2 | 0.2 | 0.2 | 不変 |
| C6 HTTPステータス（N/A） | 1.0 | 1.0 | 1.0 | 不変 |
| C7 型安全性 | 0.2 | 0.0 | 0.2 | **↓After退行** / Check微回復 |
| C8 ディレクトリ構成 | 0.8 | 1.0 | 1.0 | ↑改善 |
| C9 レスポンス形式統一 | 1.0 | 1.0 | 1.0 | 不変（既に高い） |
| C10 SC/CC分離 | 1.0 | 1.0 | 1.0 | 不変（既に高い） |

---

## 項目別分析

### C3: Zodバリデーション（0% → 100%）

**最大の改善項目**。Before では全5試行ともZodを使わなかった。

```tsx
// Before: クライアント側の手動バリデーションのみ（before_1）
const newErrors: FormErrors = {};
if (!title) newErrors.title = "タイトルは必須です";

// After: Zodスキーマ + zodResolver（after_1）
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100, "タイトルは100文字以内で入力してください"),
  description: z.string().max(500, "説明は500文字以内で入力してください").optional(),
});

// クライアント: react-hook-form + zodResolver
const { register, handleSubmit } = useForm<CreateTaskInput>({
  resolver: zodResolver(CreateTaskSchema),
});

// サーバー: 同一スキーマで二重バリデーション
const parsed = CreateTaskSchema.safeParse(input);
```

Before の before_3 は Server Action に手動バリデーション（length チェック）を実装していたが、Zod スキーマではなかった。After では全試行がクライアント・サーバー両方で同一 Zod スキーマを共有。

### C4: CSRF対策 / Server Actions（20% → 100%）

Before のうち before_3 のみ Server Actions を採用（CSRF○）。残り4試行は `fetch("/api/tasks")` 呼び出しでCSRF対策なし。

After では全試行が Server Actions を採用。Next.js 15 の Server Actions には組み込みの CSRF 保護（Content-Type ヘッダー検証）があり、C4 が100%に到達。

```tsx
// Before: fetch → CSRF保護なし（before_1）
const res = await fetch("/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title, ... }),
});

// After: Server Action → CSRF組み込み保護（after_1）
"use server";
export async function createTask(input: unknown): Promise<ActionResult<Task>> { ... }
```

### C2: ファイル名 kebab-case（20% → 80% → 60%）

Before は `TaskForm.tsx`（PascalCase）が4/5試行で発生（before_4 のみ kebab-case）。

After で改善されたが、after_3 が `TaskCreateForm.tsx`・`TaskTable.tsx`（PascalCase）を採用。
After+Check でも check_3 と check_5 が PascalCase のままで残存した。

| 試行 | コンポーネントファイル名 | C2 |
|------|----------------------|:--:|
| before_1,2,5 | `TaskForm.tsx` | ✗ |
| before_3 | `TaskForm.tsx` | ✗ |
| before_4 | `task-create-form.tsx`, `task-table.tsx` | ✓ |
| after_1,2,4,5 | `task-create-form.tsx`, `task-table.tsx` | ✓ |
| after_3 | `TaskCreateForm.tsx`, `TaskTable.tsx` | ✗ |
| check_1,2,4 | kebab-case | ✓ |
| check_3,5 | PascalCase | ✗ |

ガイドラインが "80%" の適合率止まりな理由: React コンポーネントの PascalCase 命名はエコシステム全体の慣習として根深く、ガイドラインへの上書きに抵抗が残る。

### C5: エラー分類（20%不変）

Before・After・After+Check で 20% (1/5) のまま改善なし。

- Before で PASS したのは before_4 のみ（`err instanceof Error ? err.message : "..."` で分類）
- After で PASS したのは after_3 のみ（サーバーアクションに try-catch + エラーコード分類）
- CRUD API（014）でも C5 改善が限定的だったパターンと一致

```ts
// after_3: エラー分類あり（唯一のC5 PASS）
try {
  const task = await createTask(parsed.data);
  return { success: true, data: task };
} catch {
  return {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "タスクの作成に失敗しました" },
  };
}

// after_1,2,4,5: try-catch なし（in-memory で例外が起きないため省略）
taskStore.push(task);
return { success: true, data: task };
```

In-memory ストアを使う最小実装では try-catch が必要ないため、モデルが省略する傾向がある。実際の DB 接続コードなら自然に追加されると推測される。

### C7: 型安全性（20% → 0% → 20%）— 逆転パラドックス（再現）

After で C7 が Before より**低下**した。

- Before の before_4 は控除コンポーネント state を使用し `as` キャストが不要だった
- After は全試行でActionResult の `fieldErrors` に `as Record<string, string[]>` キャストが発生

```ts
// After: ActionResultパターンで型キャスト必須（after_1,2,3,4,5）
return {
  success: false,
  error: {
    fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    //                                              ^^^^^^^^^^^^^^^^^^^^^^^^^
    //  ZodError.flatten().fieldErrors は { [x: string]: string[] | undefined }
    //  ActionResult の型定義 Record<string, string[]> に合わせるには as が必要
  },
};
```

check_5 のみこの問題を回避: 型定義を `errors: Record<string, string[]>` の代わりに直接 `parsed.error.flatten().fieldErrors` を返すシンプルな ActionResult 型を使用し、明示的 `as` キャストを排除。

```ts
// check_5: asキャストなし（C7 PASS）
export type ActionResult =
  | { success: true }
  | { success: false; errors: Record<string, string[]> };

return { success: false, errors: parsed.error.flatten().fieldErrors };
// → TypeScript が型推論で解決（明示的キャスト不要）
```

この型設計の差異により check_5 は C7 PASS だが C2 FAIL（PascalCase）でトレードオフとなり、合計スコアは同じ 8/10。

### C8: ディレクトリ構成（80% → 100%）

Before の before_3 のみ `app/` ルート（no `src/`）で C8 FAIL。残りは `src/app/dashboard/tasks/` ✓。

After では全試行が `src/features/tasks/` 構造を採用:
```
src/
├── app/
│   └── dashboard/tasks/
│       ├── page.tsx     (Server Component)
│       ├── loading.tsx
│       └── error.tsx
└── features/
    └── tasks/
        ├── components/  (task-table.tsx, task-create-form.tsx)
        ├── server/      (actions.ts)
        ├── schema/      (task-schema.ts)
        └── types/       (index.ts)
```

features ベースのディレクトリ構成は全 After/Check 試行で完全採用（一貫性 100%）。

### C10: Server / Client Component 分離（100%不変）

全15試行で PASS。Before でも Server Component でのデータ取得 + Client Component のフォームという基本分離は自然に実装された。

After の after_3 は特に高度な SC/CC 分離を実現:
- `page.tsx`: 非 async のレイアウト専用 Server Component
- `TaskTable`: `async` Server Component（自律的にデータ取得、Suspense でラップ）
- `TaskCreateForm`: Client Component（フォーム操作）

```tsx
// after_3/page.tsx: Suspense によるストリーミング
export default function TasksPage() {
  return (
    <Suspense fallback={<TaskTableSkeleton />}>
      <TaskTable />   {/* async Server Component が独立でデータ取得 */}
    </Suspense>
  );
}
```

---

## Before outlier の影響：before_4 分析

before_4 は Before 平均を大きく引き上げる outlier（8/10）。

### before_4 が高スコアの理由

| 要因 | 内容 |
|------|------|
| C2 PASS | コンポーネントを `src/components/` に kebab-case で配置（task-create-form.tsx, task-table.tsx） |
| C5 PASS | `catch (err) { setSubmitError(err instanceof Error ? err.message : "予期しないエラー") }` でエラー分類 |
| C7 PASS | コントロールド state（`useState<FormData>`）を使用、`FormData.get()` の `as` キャスト不要 |
| C10 PASS | `Suspense` でラップした async `TaskList` 内部コンポーネント + `"use client"` の `TaskCreateForm` |

### before_4 の重大な問題（C1-C10 圏外）

```ts
// ハードコードされた localhost URL（本番環境で即時破綻）
const res = await fetch("http://localhost:3000/api/tasks", { cache: "no-store" });
```

これは C1-C10 のどの基準にも引っかからないが、致命的な設計ミス。

**before_4 除外時の平均:**
- before_4 除外: (5+5+5+5)/4 = **5.0/10**
- Before→After 改善幅: 5.0 → 8.0 = +3.0（+60%）

---

## check ツールが修正した問題（C1-C10 圏外）

### revalidatePath 欠落（4/5 試行に影響）

After のうち after_2 のみ `revalidatePath("/dashboard/tasks")` を実装していた。残り4試行では Server Action でタスク作成後もページキャッシュが無効化されず、新規タスクが一覧に反映されない実行時バグが発生。

check ツールは全試行でこれを検出・修正:

```ts
// After（after_1,3,4,5）: revalidatePath なし
taskStore.push(task);
return { success: true, data: task };

// After+Check（check_1,3,4,5）: revalidatePath 追加
taskStore.push(task);
revalidatePath("/dashboard/tasks");  // ← check ツールが追加
return { success: true, data: task };
```

| 試行 | After revalidatePath | Check revalidatePath |
|------|:------------------:|:-------------------:|
| _1 | ✗ | ✓（追加） |
| _2 | ✓（元から正しい） | ✓ |
| _3 | ✗ | ✓（追加） |
| _4 | ✗ | ✓（追加） |
| _5 | ✗ | ✓（追加） |

修正率: **4/5（80%）**

---

## 命名の一貫性分析

### フォームコンポーネント名（5試行の一致率）

| 概念 | Before 試行1-5 | Before 一致率 | After 試行1-5 | After 一致率 |
|------|--------------|:------------:|--------------|:------------:|
| フォームコンポーネント名 | TaskForm×4, TaskCreateForm×1 | 4/5 | TaskCreateForm×4, TaskForm×1 | 4/5 |
| テーブルコンポーネント名 | なし or TaskTable | — | TaskTable×3, task-table×2 | — |
| Server Action 名 | createTask×1 (before_3) | — | createTask×4, createTaskAction×1 | 4/5 |
| データ取得関数名 | getTasks×1 (before_3) | — | getTasks×4, getTasks via service×1 | 4/5 |
| ファイル名形式 | PascalCase×4, kebab×1 | 1/5 | kebab×4, PascalCase×1 | 4/5 |

ガイドライン導入でファイル命名の一貫性が 1/5 → 4/5 に向上したが、完全一致（5/5）は達成できていない。

---

## 規約違反の発生頻度

### C1-C10 基準内

| 違反カテゴリ | Before 発生回数 | After 発生回数 | After+Check 発生回数 |
|-------------|:--------------:|:-------------:|:-------------------:|
| C2 PascalCase ファイル名 | 4/5 | 1/5 | 2/5 |
| C3 Zod なし | 5/5 | 0/5 | 0/5 |
| C4 CSRF 非対応 | 4/5 | 0/5 | 0/5 |
| C5 エラー未分類 | 4/5 | 4/5 | 4/5 |
| C7 as キャスト | 4/5 | 5/5 | 4/5 |
| C8 src/ 未使用 | 1/5 | 0/5 | 0/5 |

### C1-C10 圏外（実行時問題）

| 違反カテゴリ | Before 発生回数 | After 発生回数 | After+Check 発生回数 |
|-------------|:--------------:|:-------------:|:-------------------:|
| revalidatePath 欠落 | 4/5 | 4/5 | 0/5 |
| ハードコード URL | 1/5 | 0/5 | 0/5 |
| no src/ 構成 | 1/5 | 0/5 | 0/5 |

---

## 代表的な Before/After diff

### diff: フォームバリデーション

```tsx
// === Before（before_1 代表） ===
// クライアント側手動バリデーション + fetch（CSRF非対応）
"use client";
export default function TaskForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = (data.get("title") as string).trim();  // ← as string キャスト

    // 手動バリデーション
    const newErrors: FormErrors = {};
    if (!title) newErrors.title = "タイトルは必須です";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // fetch（CSRF非対応）
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }
}

// === After（after_1 代表） ===
// Zod + react-hook-form + Server Actions（CSRF組み込み）
"use client";
export function TaskCreateForm() {
  const { register, handleSubmit, reset, setError } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),  // ← クライアント側 Zod バリデーション
  });

  const onSubmit = (data: CreateTaskInput) => {
    startTransition(async () => {
      const result = await createTask(data);  // ← Server Action（CSRF保護あり）
      if (result.success) {
        reset();
      } else {
        // サーバーエラーをフィールドに反映
        for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
          setError(field as keyof CreateTaskInput, { message: messages[0] });
        }
      }
    });
  };
}
```

### diff: ディレクトリ構成

```
# === Before（before_1,2,5 代表） ===
src/
└── app/
    └── dashboard/
        └── tasks/
            ├── page.tsx         # Server Component（DB直アクセス）
            ├── TaskForm.tsx     # Client Component（PascalCase）
            ├── loading.tsx
            └── error.tsx

# === After（after_1,4,5 代表） ===
src/
├── app/
│   └── dashboard/
│       └── tasks/
│           ├── page.tsx         # Server Component（actionsを呼ぶのみ）
│           ├── loading.tsx
│           └── error.tsx
└── features/
    └── tasks/
        ├── components/
        │   ├── task-create-form.tsx  # Client Component（kebab-case）
        │   └── task-table.tsx        # 表示専用コンポーネント
        ├── server/
        │   └── actions.ts            # Server Actions（"use server"）
        ├── schema/
        │   └── task-schema.ts        # Zod スキーマ（共有）
        └── types/
            └── index.ts              # ActionResult 型定義
```

---

## テスト間比較（013/014/015 横断）

| テスト | Before avg | After avg | After+Check avg | Before→After |
|--------|:----------:|:---------:|:---------------:|:------------:|
| 013 認証ミドルウェア | 5.4/10 | 7.8/10 | 7.8/10 | +2.4（+44%） |
| 014 CRUD API | 5.8/10 | 8.2/10 | 8.4/10 | +2.4（+41%） |
| 015 UIコンポーネント | 5.6/10 | 8.0/10 | 8.0/10 | +2.4（+43%） |
| **全体平均** | **5.6/10** | **8.0/10** | **8.1/10** | **+2.4（+43%）** |

**一貫した発見:**
- Before→After の改善幅は全テストで **+2.4 点** と完全に一致
- After→After+Check の C1-C10 スコア変化は全テストで **0 または +0.2 の微増**
- check ツールの価値は C1-C10 外の実行時正確性（revalidatePath, redirect先修正, HTTPS強制等）にある

### テスト固有の特徴

| テスト | C7 挙動 | C4 挙動 | check ツール主な修正 |
|--------|---------|---------|-------------------|
| 013 認証 | After で jose の `as` 増加（パラドックス） | 全 After PASS | ミドルウェアのリダイレクト先修正 |
| 014 CRUD | After/Check ともに C7 高い（Drizzle $inferSelect） | 全試行 FAIL（プロンプト非要求） | UUID バリデーション追加 |
| 015 UI | After で ActionResult `as` 増加（パラドックス再現） | After PASS（Server Actions） | revalidatePath 追加 |

---

## 考察・インサイト

### 1. C7 パラドックス（013/015 共通パターン）

ガイドラインが推奨する「型安全なパターン」を採用することで、**Before より多くの `as` キャストが必要になる**逆説が 013 と 015 の両方で再現した。

- 013: jose の JWTPayload は generic 型 → custom 型定義を追加するほど `as JWTPayload` が必要
- 015: Zod の `fieldErrors` は `{ [x: string]: string[] | undefined }` → ActionResult の `Record<string, string[]>` に合わせると `as` 必要

C7 は「型安全性の指標」として設計されたが、「高度な型定義を活用するほど型キャストが増える」という TypeScript の現実を反映する。`as` 禁止ルールは、型安全性向上のための `as` も禁じてしまう点で評価指標として限界がある。

### 2. check ツールの役割分担

3テストを通じて check ツールの役割が明確になった:

| 領域 | CLAUDE.md の効果 | check ツールの効果 |
|------|:---------------:|:----------------:|
| コード品質（C1-C10） | 大（+2.4点） | 小（0〜+0.2点） |
| 実行時正確性 | 中（パターン誘導） | 大（修正率 80%） |
| セキュリティ強化 | 中（基本パターン） | 中（追加チェック） |

**結論**: CLAUDE.md はコード品質の「底上げ」、check ツールは「実行時バグの除去」という補完的な役割を担う。

### 3. 完全自動化の限界（C5）

エラー分類（C5）は3テスト通じて Before/After で改善が見られない唯一の項目（Before 20%前後、After も同程度）。

理由: C5 の改善には「どのような例外が起きうるか」のドメイン知識が必要。最小実装では実際に例外が起きないコード（in-memory store）にも try-catch を強制する必要があり、モデルが「不要な防衛コード」として省略する傾向がある。
