# テスト 006: T5 exhaustive union check 修正

## 背景

T5（`never` を使った Union 型の網羅性チェック）はテスト 001 で **0% Pass**。AI は `default: { const _exhaustive: never = status; }` パターンを一度も使用しなかった。

## 変更内容

**修正前:** code.md に exhaustive check ルールなし。

**修正後:** §2.4 "Exhaustive Checks on Union Types" を MUST ルールと具体例付きで追加。

## 結果

**修正効果を確認。** `never` パターンの明示で 0/4 → 4/4 の遵守率に改善。

| 条件 | T5（never exhaustive check） | パターン |
|------|:---:|------|
| 修正前 | **Fail** (0/4) | if チェーン、コンパイル時の安全性なし |
| 修正後 | **Pass** (4/4) | `switch` + `default: { const _exhaustive: never = ... }` |

[→ 詳細分析](../../../results/analysis.md)

---

Languages: [English](../../../../README.md) | 日本語
