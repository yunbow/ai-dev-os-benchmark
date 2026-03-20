# テスト 009: Phase 2 再採点 — 全11項目の具体化修正

## 背景

テスト 008 では4項目の修正だけでは全体スコアが改善しなかった。本テストは**全11項目の具体化修正**を適用し、3つの追加ガイドラインファイル（routing.md, performance.md, ui.md）で E4/E5, P4, AC2 をカバーする。

## 変更内容（累積）

| 項目 | 修正 | ファイル |
|------|-----|---------|
| V9 | 日付範囲: MUST use `.refine()` | validation.md |
| N7 | イベントハンドラ: MUST handle+名詞+動詞 | naming.md |
| T5 | 網羅性: MUST use `never` | code.md |
| P4 | Dynamic import: SHOULD + 候補リスト | performance.md |
| S11 | レート制限: MUST auth Server Actions に適用 | security.md |
| E4 | error.tsx: MUST 各ルートグループに配置 | routing.md |
| E5 | not-found.tsx: MUST ルートに配置 | routing.md |
| V3 | クライアント検証: MUST zodResolver 使用 | validation.md |
| N1 | ファイル名: コンポーネントも kebab-case | naming.md |
| T4 | `as` 最小化: MUST NOT formData.get() に使用 | code.md |
| AC2 | アイコンボタン: MUST aria-label | ui.md |

## 条件

| 条件 | ファイル数 | トークン |
|------|:---:|:---:|
| A: ガイドラインなし | 要件のみ | ~2K |
| C: 厳選13（Phase 2） | 要件 + 13ガイドラインファイル | ~36K |

## 結果

| 条件 | スコア | 001 平均との比較 |
|------|:---:|:---:|
| A: ガイドラインなし | **82.7** | 84.1（−1.4） |
| C: 厳選13（Phase 2） | **77.8** | 84.9（−7.1） |

**ファイルを3つ追加したら悪化した。** 厳選セットが10ファイル（~24K tokens）から13ファイル（~36K tokens）に増加。50%のトークン増加が、11項目の具体化修正の効果を上回る注意分散を引き起こした。

| 改善した項目（2/11） | まだ失敗（9/11） |
|---|---|
| V3: クライアント検証 ✅ | S11, E4, E5, V9, N1, N7, T4, T5, P4 |
| AC2: aria-label ✅ | |

**教訓:** 「Less is More」原則は厳選セットにも適用される。修正は新しいファイルの追加ではなく、既存ファイルへの統合で行うべき。

[→ 詳細分析](../../../results/analysis.md)

---

Languages: [English](../../../../README.md) | 日本語
