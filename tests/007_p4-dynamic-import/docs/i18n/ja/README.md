# テスト 007: P4 Dynamic Import 修正

## 背景

P4（重いコンポーネントに `React.lazy` / `next/dynamic` を使用）はテスト 001 で **0% Pass**。AI は重いクライアントコンポーネントに動的インポートを一度も使用しなかった。

## 変更内容

**修正前:** 1行の例のみ: `const Editor = dynamic(() => import('./Editor'), { ssr: false });`

**修正後:** SHOULD ルールに拡張し、具体的な候補リストを追加:
```
動的インポートの候補:
* リッチテキストエディタ、コードエディタ
* チャート/グラフコンポーネント（recharts, chart.js）
* 初期表示に不要なモーダル/ダイアログ
* 50KB超の依存を持つコンポーネント
```

## 結果

**修正効果を確認。** 候補リスト + SHOULD ルールで 0/4 → 3/3 の正しい dynamic import に改善。

| 条件 | P4（dynamic import） | 詳細 |
|------|:---:|------|
| 修正前 | **Fail** (0/4) | 全て static import |
| 修正後 | **Pass** (3/3) | TaskChart, RichTextEditor, CreateTaskDialog → `dynamic()`。TaskList, StatsCards → static（正しい） |

[→ 詳細分析](../../../results/analysis.md)

---

Languages: [English](../../../../README.md) | 日本語
