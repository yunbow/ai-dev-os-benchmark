# AI Dev OS Benchmark

同じプロンプト、同じモデル、異なるルール — AI コード品質への影響を測定

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../../LICENSE)

> AI にコーディングルールを与えると、本当にアウトプットは改善されるのか？ このベンチマークは [AI Dev OS](https://github.com/yunbow/ai-dev-os) ガイドラインが AI 生成コードの品質に与える影響をデータで測定します。

## 最重要発見: 生成 → チェック → 修正

| アーキテクチャ | スコア | ベースラインとの差 |
|-------------|:---:|:---:|
| ガイドラインなし（ベースライン） | ~84 | — |
| CLAUDE.md に静的10ファイル | ~85-91 | **≈ 0**（ばらつき範囲内） |
| チェック+修正のみ（CLAUDE.md なし） | 95.2 | **+9.9** |
| **CLAUDE.md 3ファイル + チェック+修正** | **96.9** | **+12.5** |

静的ガイドラインだけでは総合スコアは改善しない。**事後検証**が真の品質メカニズム。最適アーキテクチャ:

```
CLAUDE.md: プロジェクト固有3ファイル（~8Kトークン）
  → AI がコード生成
  → /ai-dev-os-check がチェックリストで検証
  → AI が全違反を修正
  → スコア: 96.9/100
```

## 「少ないほど良い」原則 — 3回のテストで確認

| テスト | 追加した内容 | 結果 | 詳細 |
|--------|------------|------|------|
| [001: ガイドライン量](../../../tests/001_guideline-impact/) | +28ガイドラインファイル（+73Kトークン） | ベースラインより**悪化**（−4.8点） | 注意分散 |
| [002: Before/After 例](../../../tests/002_before-after-effect/) | +280行のコード例（+55%） | **改善なし** | 散文で十分 |
| [003: YAML チェックリスト](../../../tests/003_checklist-format/) | +165行のYAML/Quick Rules（+33%） | **改善なし** | メタデータは無価値 |

## 具体性の修正 — 全4項目で 0% → 100%

テスト 001 で全実行で失敗した項目を、ガイドラインを**より具体的に**（より長くではなく）することで修正:

| テスト | 項目 | 修正前（0% Pass） | 修正後（100% Pass） | 何を変えたか |
|--------|------|-------------------|-------------------|------------|
| [004](../../../tests/004_v9-date-range-fix/) | V9: 日付範囲 | "Cross-field constraints" | "MUST validate using `.refine()`" | メソッド名を明示 |
| [005](../../../tests/005_n7-event-handler-naming/) | N7: ハンドラ命名 | ルールなし | "MUST use `handle` + 名詞 + 動詞" | ❌/✅ 例を追加 |
| [006](../../../tests/006_t5-exhaustive-union-check/) | T5: 網羅性チェック | ルールなし | "MUST use `never` in default case" | 正確なパターンを提示 |
| [007](../../../tests/007_p4-dynamic-import/) | P4: Dynamic import | 1行の例のみ | SHOULD + 候補リスト（> 50KB） | 判断基準を追加 |

**主要な洞察:** AI はこれらのパターンを既に*知っている*。必要なのは**どこで、どのように**適用するかであり、パターンそのものではない。

## テスト結果

### 001: ガイドライン量の影響（3回 × 3条件）

| 条件 | 平均スコア | ベースラインとの差 |
|------|:---:|:---:|
| A: ガイドラインなし | 84.1 | — |
| B: 全28ファイル（~75Kトークン） | 79.3 | **−4.8** |
| C: 厳選10ファイル（~24Kトークン） | 84.9 | **+0.8** |

[→ 詳細・分析](../../../tests/001_guideline-impact/)

### 002: Before/After 例の効果（5タスク × 2条件）

| | D（例なし） | E（例あり） |
|---|:---:|:---:|
| 勝利数 | 3 | 0 |
| 引き分け | 2 | 2 |
| 合計Pass | 18/18 | 17/18 |

[→ 詳細・分析](../../../tests/002_before-after-effect/)

### 003: YAML チェックリスト形式（5タスク × 2条件）

| | A（散文のみ） | C（YAML+QR） |
|---|:---:|:---:|
| 合計Pass | 18/18 | 17/18 |

[→ 詳細・分析](../../../tests/003_checklist-format/)

### 011: 動的チェック効果（生成 → チェック → 修正）

| 条件 | スコア | 差 |
|------|:---:|:---:|
| ベースラインのみ | 85.3 | — |
| **ベースライン → チェック+修正** | **95.2** | **+9.9** |

事後チェック+修正が全テスト中**最大の改善**。[→ 詳細](../../../tests/011_dynamic-check-effect/)

### 012: 最小静的 + チェック（最適アーキテクチャ）

| 条件 | スコア | 差 |
|------|:---:|:---:|
| チェックのみ（0ファイル） | 87.4 | — |
| **3ファイル + チェック** | **96.9** | **+9.5** |

**96.9 — 過去最高スコア。** 3つのプロジェクト固有ファイル + チェック+修正が最適アーキテクチャ。[→ 詳細](../../../tests/012_minimal-static-plus-check/)

## 再現手順

```bash
git clone https://github.com/yunbow/ai-dev-os-benchmark.git
cd ai-dev-os-benchmark

# 各テストに専用の素材とプロンプトがあります
cat tests/001_guideline-impact/assets/prompts/curated-guidelines.md
```

<details>
<summary>リポジトリ構成</summary>

```
ai-dev-os-benchmark/
├── spec/
│   └── benchmark_design.md
├── tests/
│   ├── 001_guideline-impact/
│   │   ├── README.md                  # サマリー（EN + JA）
│   │   ├── assets/                    # プロンプト、ガイドライン、評価シート
│   │   └── results/                   # 3回 × 3条件 + analysis.md
│   ├── 002_before-after-effect/
│   │   ├── README.md
│   │   ├── assets/
│   │   └── results/
│   ├── 003_checklist-format/
│   │   ├── README.md
│   │   ├── assets/
│   │   └── results/
│   └── 004_xxx/                       # 今後のテスト...
└── LICENSE
```

</details>

## 関連

| リポジトリ | 説明 |
|---|---|
| [ai-dev-os](https://github.com/yunbow/ai-dev-os) | フレームワーク仕様と理論 |
| [ai-dev-os-rules-typescript](https://github.com/yunbow/ai-dev-os-rules-typescript) | 本ベンチマークで使用する TypeScript / Next.js ガイドライン |

## ライセンス

[MIT](../../../LICENSE)

---

Languages: [English](../../../README.md) | 日本語
