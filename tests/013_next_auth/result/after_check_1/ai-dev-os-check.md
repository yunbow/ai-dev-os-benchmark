# AI Dev OS Check & Fix Report

> 実行日: 2026-03-31
> 対象プロジェクト: `ai-dev-os-benchmark_test/20260330/test_a/after_1`
> スキル: `/ai-dev-os-check` (手動実行)
> 使用ガイドライン: `security.md`, `validation.md`

---

## Scope

- **Mode**: Check & Fix
- **Target**: `src/` 配下の全ファイル（untracked）
- **Files checked**: 7

```
src/lib/jwt.ts
src/lib/auth/schemas.ts
src/lib/auth/users.ts
src/app/api/auth/register/route.ts
src/app/api/auth/login/route.ts
src/middleware.ts
src/app/dashboard/page.tsx
```

---

## Summary

- ✅ Passed: 4
- 🔧 Fixed: 3
- ⚠️ Manual Review: 1

---

## Fixed Violations

| # | File | Line | Rule | 修正内容 |
|---|------|------|------|---------|
| 1 | `src/lib/jwt.ts` | 4 | security §1 — Never include secrets in code | ハードコードフォールバック `"dev-secret-change-in-production"` を削除し、`JWT_SECRET` 未設定時に例外をスロー |
| 2 | `src/app/api/auth/register/route.ts` | 1 | security §3.2 — MUST apply rate limiting to auth endpoints | IPベースのレート制限を実装（10 req / 60 s）、`src/lib/rate-limit.ts` を新規作成 |
| 3 | `src/app/api/auth/login/route.ts` | 1 | security §3.2 — MUST apply rate limiting to auth endpoints | IPベースのレート制限を実装（10 req / 60 s） |

### Fix 1: `src/lib/jwt.ts`

```diff
-const secret = new TextEncoder().encode(
-  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
-);
+if (!process.env.JWT_SECRET) {
+  throw new Error("JWT_SECRET environment variable is required");
+}
+
+const secret = new TextEncoder().encode(process.env.JWT_SECRET);
```

### Fix 2 & 3: `register/route.ts` / `login/route.ts`

```diff
-// TODO: Add rate limiting (10 req/min) before production
 import { NextRequest, NextResponse } from "next/server";
+import { checkRateLimit } from "@/lib/rate-limit";

 export async function POST(req: NextRequest) {
+  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
+  const { success } = await checkRateLimit(`auth:register:${ip}`, {
+    maxRequests: 10,
+    windowMs: 60_000,
+  });
+  if (!success) {
+    return NextResponse.json(
+      { error: "Too many attempts. Try again later." },
+      { status: 429 }
+    );
+  }
+
   const body = await req.json();
```

---

## Manual Review Required

| # | File | Line | Rule | 理由 |
|---|------|------|------|------|
| 1 | `src/middleware.ts` | — | security §3.4 — CSP Nonce Header | CSPノンスの追加は `layout.tsx` へのnonce伝播など設計変更が必要なため自動修正不可 |

### 対応方針（手動）

```typescript
// src/middleware.ts に追加
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const csp = `script-src 'nonce-${nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none';`;
response.headers.set("Content-Security-Policy", csp);
response.headers.set("x-nonce", nonce);
```

その後 `src/app/layout.tsx` でノンスを受け取り、`<Script>` タグに伝播させる対応が必要。

---

## Checklist Coverage

| カテゴリ | 項目 | 結果 |
|---------|------|------|
| Zod バリデーション | 全入力に Zod スキーマあり | ✅ |
| 型安全性 | `any` / 不要な `as` キャストなし | ✅ |
| Cookie セキュリティ | `httpOnly: true`, `sameSite: "lax"` | ✅ |
| パスワードハッシュ | `bcrypt` (cost=12) | ✅ |
| JWT シークレット | ハードコード削除済み | 🔧 Fixed |
| レート制限 (register) | 10 req/60s | 🔧 Fixed |
| レート制限 (login) | 10 req/60s | 🔧 Fixed |
| CSP ノンス | middleware.ts に未実装 | ⚠️ Manual |
| App Router 規約 | `page.tsx` / `route.ts` 準拠 | ✅ |
| Server/Client 分離 | `dashboard/page.tsx` は Server Component | ✅ |

- **Items checked**: 10 / 10
- **Pass rate**: 90%（修正後）

---

