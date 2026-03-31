# AI Dev OS Check & Fix Report

## Scope
- Mode: Check & Fix
- Target: ステージ済みファイル（新規追加）
- Files checked: 5
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/register/route.ts`
  - `src/features/auth/schema/index.ts`
  - `src/lib/auth/jwt.ts`
  - `src/middleware.ts`

## Summary
- ✅ Passed: チェックリスト項目の大半 / 🔧 Fixed: 1 / ⚠️ Manual Review: 2

## Fixed Violations

| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/app/api/auth/login/route.ts` | 34 | security.md §6 (HTTPS/Cookie Secure) | Cookie に `Secure` 属性を追加 |

## Manual Review Required

| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/app/api/auth/login/route.ts` / `register/route.ts` | — | security.md §3.2 (Rate Limiting) | 認証エンドポイントにレート制限なし。`checkRateLimit()` の実装とUpstash/Redisの導入が必要 |
| 2 | `src/app/api/auth/login/route.ts` / `register/route.ts` | — | security.md §2 (CSRF: Origin/Referer check) | POST状態変更APIでのOrigin/Refererチェックが未実装。SameSite=Laxで一定の保護はあるが、明示的なチェックが推奨 |

## Checklist Coverage
- Items checked: 15 / 15
- Pass rate: 87% (after fixes)
