# Test 013: Next.js 認証ミドルウェア — プロンプトA 評価レポート

> 検証日: 2026-03-31
> 対象プロンプト: プロンプトA「認証ミドルウェア」（JWT ベース認証 + /api/auth/login・register + /dashboard 保護）
> 評価モデル: claude-sonnet-4-6
> 評価基準: `01_nextjs-tutorial_verification.md` §評価基準の定義（C1〜C10）

## 使用プロンプト

```
このNext.js 15 (App Router) プロジェクトに認証ミドルウェアを実装してください。

要件:
- JWT ベースの認証
- /api/auth/login と /api/auth/register のエンドポイント
- 保護されたルート（/dashboard 以下）へのアクセス制御
- middleware.ts でのトークン検証

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
| 1 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | **5/10** | Zod なし、src/ なし、`as` キャスト、レスポンス形式不統一 |
| 2 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | **5/10** | Zod なし、src/ なし、`as` キャスト、平文パスワード保存 |
| 3 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | **6/10** | Zod なし、src/ なし、平文パスワード保存 |
| 4 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | **5/10** | Zod なし、middleware.ts が src/ 外、`as` キャスト |
| 5 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | **6/10** | Zod なし、src/ なし、SHA-256 のみ（salt なし） |
| **平均** | **1.0** | **1.0** | **0.0** | **1.0** | **0.0** | **1.0** | **0.4** | **0.0** | **0.0** | **1.0** | **5.4/10** | |

### After（AI Dev OS ガイドライン導入後）— 5回採点

| 試行 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | 合計 | 特記事項 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:----:|---------|
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | **7/10** | json() 未 try-catch、bcrypt 導入、Zod 導入 |
| 2 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | **8/10** | callbackUrl リダイレクト、ユーザー列挙攻撃対策コメント |
| 3 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | **8/10** | src/features/auth 分離、x-user-id ヘッダー伝達 |
| 4 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | **8/10** | タイミング攻撃対策（DUMMY_HASH）、最もセキュリティ意識が高い |
| 5 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | **8/10** | getToken() ヘルパー抽出、confirmPassword バリデーション |
| **平均** | **1.0** | **1.0** | **1.0** | **1.0** | **0.8** | **1.0** | **0.0** | **0.8** | **0.2** | **1.0** | **7.8/10** | |

---

## 品質スコア比較

| | Before 平均 | After 平均 | 改善幅 |
|---|:-----------:|:----------:|:------:|
| プロンプトA: 認証ミドルウェア | 5.4/10 | 7.8/10 | **+2.4** |

---

## 項目別分析

### 改善した項目（Before→After）

| 項目 | Before 通過率 | After 通過率 | 差分 | 考察 |
|------|:------------:|:------------:|:----:|------|
| C3: Zodバリデーション | 0/5 (0%) | 5/5 (100%) | **+100%** | 最大の改善。ガイドライン導入後は全試行でZod採用 |
| C5: エラー分類 | 0/5 (0%) | 4/5 (80%) | **+80%** | json()パース失敗の明示的ハンドリングが定着 |
| C8: ディレクトリ構成 | 0/5 (0%) | 4/5 (80%) | **+80%** | src/ ディレクトリ準拠が定着（after_4 のみ middleware.ts 配置ミス） |

### 改善しなかった項目

| 項目 | Before 通過率 | After 通過率 | 考察 |
|------|:------------:|:------------:|------|
| C7: 型安全性（as キャスト） | 2/5 (40%) | 0/5 (0%) | **逆に悪化**。After では全試行が独自 JWTPayload 型を定義したため、jose の型から変換する `as` キャストが必要になった。Before で型定義なし → `as` なし という試行が通過していた。 |
| C9: レスポンス形式統一 | 0/5 (0%) | 1/5 (20%) | わずかな改善のみ（after_4 が `{ success: true }` で統一）。`{ data, error }` パターンの採用は稀。 |
| C1: 命名規則 | 5/5 (100%) | 5/5 (100%) | 変化なし。元々高水準 |
| C2: ファイル名 kebab-case | 5/5 (100%) | 5/5 (100%) | 変化なし |
| C4: 認証チェック | 5/5 (100%) | 5/5 (100%) | 変化なし（middleware.ts の実装は元々確実） |
| C6: HTTPステータスコード | 5/5 (100%) | 5/5 (100%) | 変化なし |
| C10: SC/CC分離 | 5/5 (100%) | 5/5 (100%) | プロンプトAはAPIルートが主体のため、dashboard は全試行でデフォルト SC |

---

## 命名一貫性チェック

### Before（5試行）

| 概念 | 試行1 | 試行2 | 試行3 | 試行4 | 試行5 | 一致数 |
|------|-------|-------|-------|-------|-------|--------|
| ユーザー取得関数名 | インライン | `findUserByEmail` | インライン | `findUserByEmail` | インライン | 2/5 |
| 認証チェック関数名 | `jwtVerify`（直接） | `verifyToken` | `jwtVerify`（直接） | `verifyToken` | `jwtVerify`（直接） | 2/5 |
| エラーレスポンス形式 | `{ error }` | `{ error }` | `{ error }` | `{ error }` | `{ error }` | **5/5** |
| ミドルウェアファイル配置 | root/ | root/ | root/ | root/ | root/ | **5/5** |
| Zodスキーマ命名 | N/A（未使用） | N/A | N/A | N/A | N/A | 0/5 |

**Before 合計: 14/25 (56%)**

### After（5試行）

| 概念 | 試行1 | 試行2 | 試行3 | 試行4 | 試行5 | 一致数 |
|------|-------|-------|-------|-------|-------|--------|
| ユーザー取得関数名 | `findUserByEmail` | `findUserByEmail` | `users.get()` | `userStore.findByEmail` | `users.get()` | 2/5 |
| 認証チェック関数名 | `verifyJWT` | `verifyToken` | `verifyToken` | `verifyJwt` | `verifyToken` | 3/5 |
| エラーレスポンス形式 | `{ error }` | `{ error }` | `{ error }` | `{ error }` | `{ error }` | **5/5** |
| ミドルウェアファイル配置 | `src/` | `src/` | `src/` | root（誤） | `src/` | 4/5 |
| Zodスキーマ命名 | `LoginSchema` / `RegisterSchema` | `loginSchema` / `registerSchema` | `loginSchema` / `registerSchema` | `LoginSchema` / `RegisterSchema` | `loginSchema` / `registerSchema` | 2/5（PascalCase vs camelCase で分裂） |

**After 合計: 16/25 (64%)**

**命名一貫性の改善: +8% （限定的）**

---

## 規約違反発生頻度（プロンプトA × 5回）

| 違反カテゴリ | Before 発生回数 | After 発生回数 | 改善 |
|-------------|:--------------:|:-------------:|:----:|
| バリデーション欠如（Zod なし） | **5/5** | 0/5 | ✅ -100% |
| 不適切なエラーハンドリング（json() 未 try-catch） | **5/5** | 1/5 | ✅ -80% |
| セキュリティ考慮不足（平文パスワード / 弱いハッシュ） | **4/5** | 0/5 | ✅ -100% |
| ディレクトリ構成違反（src/ 未使用） | **5/5** | 1/5 | ✅ -80% |
| 型安全性違反（`as` キャスト） | 3/5 | **5/5** | ❌ +40%（悪化） |
| レスポンス形式不統一 | **5/5** | 4/5 | △ -20% |
| 命名規則違反 | 0/5 | 0/5 | — |

---

## Before/After 代表コード比較

代表試行: **before_3**（6/10、平均に最も近い）vs **after_2**（8/10、機能が充実）

### diff 1: 入力バリデーション

**Before（before_3/app/api/auth/login/route.ts）**
```typescript
// Before: 手動チェックのみ、型・形式バリデーションなし
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }
  // ...
}
```

**After（after_2/src/app/api/auth/login/route.ts）**
```typescript
// After: Zod スキーマで型・形式・長さを一括バリデーション
import { loginSchema } from "@/features/auth/schema";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  // ...
}
```

主な差異:
- Zod による email 形式チェック + パスワード最小長チェックが自動化
- `request.json()` のパースエラーを明示的に処理（`.catch(() => null)`）
- バリデーション失敗時のレスポンスが詳細（`fieldErrors`）

### diff 2: パスワード保管

**Before（before_3: 平文保存）**
```typescript
// パスワードをそのままオブジェクトに格納
const user = { id: crypto.randomUUID(), email, password };
users.push(user);
```

**After（after_2/src/features/auth/services/user-store.ts）**
```typescript
import bcrypt from "bcryptjs";

export async function createUser(email: string, password: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 12);
  const user: User = { id: randomUUID(), email, hashedPassword };
  users.set(email, user);
  return user;
}
```

主な差異:
- bcrypt（cost factor 12）でハッシュ化してから保存
- ユーザーストアを独立したモジュールに分離（単一責任）

### diff 3: ミドルウェアの精度

**Before（before_3/middleware.ts）**
```typescript
// matcher で絞り込んでいるが、cookie 削除なし・callbackUrl なし
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

**After（after_2/src/middleware.ts）**
```typescript
// callbackUrl 付きリダイレクト、ユーザー情報をヘッダーで伝達
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(req);  // callbackUrl クエリパラメータ付き
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return redirectToLogin(req);
  }

  // 検証済みユーザー情報を Server Component に伝達
  const res = NextResponse.next();
  res.headers.set("x-user-id", payload.userId);
  res.headers.set("x-user-email", payload.email);
  return res;
}
```

主な差異:
- `callbackUrl` クエリパラメータでログイン後の戻り先を保持
- verifyToken が null を返す設計（例外スローではなく null 返却）で呼び出し側の try-catch 不要
- 検証済みユーザー情報を `x-user-id` / `x-user-email` ヘッダーで Server Component に伝達

---

## 考察と記事への示唆

### ガイドライン導入の効果（定量）

- **スコア改善: +2.4点（5.4→7.8, +44%相対改善）**
- **バリデーション欠如: 5/5→0/5（100%解消）**
- **パスワード平文保存: 4/5→0/5（100%解消）**
- **ディレクトリ構成違反: 5/5→1/5（80%改善）**

### 効果が限定的だった領域

**C7（型安全性）の悪化**は記事で正直に述べるべき重要な知見:
- ガイドライン導入後に独自 `JWTPayload` 型を全試行が定義した結果、jose の返り型から変換する `as` キャストが必要になった
- Before で「型なし」→「`as` なし」という試行が C7 Pass していた（型安全性が高いわけではなく、型定義自体がない状態）
- **実態**: After の方が型安全性は高い（型定義あり）が、評価基準の文字通りの適用では「悪化」に見える
- 記事には「`as` キャストが増えた理由」の説明を加えることを推奨

**C9（レスポンス形式）の改善が小さい**:
- `{ data, error }` パターンの徹底には、ガイドラインに具体的なレスポンス型定義の例示が必要
- 現状のガイドラインでは abstract すぎて AI が採用しにくい可能性

### 命名一貫性

- 一貫性スコア: Before 56% → After 64%（**+8%、小幅改善**）
- エラーレスポンス形式（`{ error }`）は Before から100%一致しており、改善の余地がなかった
- 認証関数名（`verifyToken` vs `verifyJWT` vs `verifyJwt`）のばらつきは After でも残存 → ガイドラインへの関数名プレフィックス規約の追記を検討

### After 試行間の品質ばらつき

after_4 は最も高品質（タイミング攻撃対策の DUMMY_HASH、globalThis HMR 対応）だが、middleware.ts の配置ミスで C8 が Fail。**ガイドラインの詳細さとランダム性の両方が品質に影響している**ことを示している。

---

## 補足事項

- C10（SC/CC 分離）は全試行 Pass: プロンプトA の主要成果物は API Route と middleware であり、dashboard page は全試行で単純な Server Component（`async function` や `'use client'` なし）として出力された。
- 検証環境: 各試行は独立した会話セッション（コンテキストリセット済み）
- Before 試行のパスワードハッシュ: before_4 は Web Crypto (SHA-256 + salt)、before_5 は SHA-256（salt なし）を使用。bcrypt 相当のセキュリティには及ばない。
