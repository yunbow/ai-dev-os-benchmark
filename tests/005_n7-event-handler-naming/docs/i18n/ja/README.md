# テスト 005: N7 イベントハンドラ命名修正

## 背景

N7（イベントハンドラ命名パターン `handle` + 名詞 + 動詞）はテスト 001 で **0% Pass**。AI は一貫して `handleDelete`, `handleSubmit` を使用し、`handleTaskDelete`, `handleFormSubmit` とはしなかった。

## 変更内容

**修正前:** naming.md にイベントハンドラ命名ルールなし。

**修正後:** §8 "Event Handlers and Callbacks" を追加:
```
* MUST use handle + noun + verb: handleTaskDelete, handleFormSubmit
```

## 結果

**修正効果を確認。** 明示的な MUST ルールと ❌/✅ 例の追加でハンドラ命名が 0/3 → 5/5 に改善。

| 条件 | N7（handle + 名詞 + 動詞） | 例 |
|------|:---:|------|
| 修正前 | **Fail** (0/3) | `handleDelete`, `handleEdit` |
| 修正後 | **Pass** (5/5) | `handleTaskDeleteConfirm`, `handleTaskEdit`, `handleStatusToggle` |

[→ 詳細分析](../../../results/analysis.md)

---

Languages: [English](../../../../README.md) | 日本語
