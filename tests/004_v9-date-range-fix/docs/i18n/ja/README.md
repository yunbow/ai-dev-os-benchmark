# テスト 004: V9 日付範囲バリデーション修正

## 背景

テスト 001（ガイドライン量の影響）で、V9（日付形式/範囲チェック）は**全9回の実行で 0% Pass**（3条件 × 3回）でした。AI は日付形式は検証するが、日付範囲（例: 期限は未来日であること）は一度もチェックしませんでした。

## 変更内容

**修正前 (validation.md):**
```
* Cross-field constraints: e.g., endDate must be after startDate
```

**修正後 (validation.md):**
```
* Date range constraints: MUST validate that future-facing dates (e.g., dueDate, expiresAt)
  are in the future using .refine()
```

## テスト設計

- **タスク:** `dueDate` フィールド付きの Create Task Server Action
- **チェック:** Zod スキーマが `dueDate` の未来日チェックを行うか？
- **条件:** 修正前ガイドライン vs 修正後ガイドライン
- **ターゲット項目:** V9

## 結果

**修正効果を確認。** 具体的なガイドライン文言が AI に正しい位置へのバリデーション配置を促した。

| 条件 | V9（日付範囲チェック） |
|------|:---:|
| 修正前 | **Fail** — Server Action 内でチェック（Zod スキーマ外） |
| 修正後 | **Pass** — Zod スキーマ内に `.refine()` で配置 |

**主要な洞察:** AI は両条件で未来日チェックを*知っていた*が、ガイドラインが「using `.refine()`」と明示した場合にのみ Zod スキーマ（正しい位置）に配置した。ガイドラインの**具体性**が遵守率を左右する。

[→ 詳細分析](../../../results/analysis.md)

---

Languages: [English](../../../../README.md) | 日本語
