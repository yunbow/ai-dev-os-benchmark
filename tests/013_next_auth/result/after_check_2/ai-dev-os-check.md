## AI Dev OS Check & Fix Report

### Scope
- Mode: Check & Fix
- Target: staged changes (`git diff --cached`)
- Files checked: 7

### Summary
- ✅ Passed: 12 / 🔧 Fixed: 1 / ⚠️ Manual Review: 2

### Fixed Violations
| # | File | Line | Rule | What was fixed |
|---|------|------|------|----------------|
| 1 | `src/lib/auth/jwt.ts` | 3-5 | Security: シークレットをコードに含めない | フォールバックのハードコード値を削除し、`JWT_SECRET` 未設定時にエラーをスローするよう変更 |

### Manual Review Required
| # | File | Line | Rule | Why manual review is needed |
|---|------|------|------|----------------------------|
| 1 | `src/app/api/auth/login/route.ts` | 9 | Security: auth エンドポイントへのレート制限 MUST | TODO コメントのみで未実装。`checkRateLimit` の実装選定（メモリ/Redis）が必要なため手動対応 |
| 2 | `src/app/api/auth/register/route.ts` | 5 | Security: auth エンドポイントへのレート制限 MUST | 同上 |

### Checklist Coverage
- Items checked: 15 / 15
- Pass rate: 87% (after fixes)
