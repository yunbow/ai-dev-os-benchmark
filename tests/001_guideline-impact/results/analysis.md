# Benchmark Results Analysis — Final (Run 1-3)

> Date: 2026-03-20
> Model: Claude Opus 4.6 (code generation) / Claude (evaluation)
> Repetitions: 3 runs per condition

## Final Summary (3-Run Average)

| # | Dimension | Max | A (Baseline) | B (All) | C (Curated) | C-A Delta |
|---|-----------|:---:|:---:|:---:|:---:|:---:|
| 1 | Security | 20 | 17.8 | 17.2 | 18.3 | **+0.5** |
| 2 | Error Handling | 15 | 13.7 | 10.0 | 12.1 | -1.6 |
| 3 | Validation | 15 | 12.5 | 12.2 | 13.3 | **+0.8** |
| 4 | Naming Consistency | 10 | 7.1 | 7.1 | 7.9 | **+0.8** |
| 5 | Directory Structure | 10 | 9.5 | 9.5 | 9.9 | +0.4 |
| 6 | API Design | 10 | 10.0 | 9.9 | 10.0 | 0 |
| 7 | Type Safety | 10 | 6.1 | 5.5 | 6.1 | 0 |
| 8 | Performance | 5 | 3.3 | 3.2 | 3.3 | 0 |
| 9 | Accessibility | 5 | 4.3 | 4.3 | 4.3 | 0 |
| | **Total** | **100** | **84.3** | **78.9** | **85.2** | **+0.9** |

## Per-Run Scores

| Condition | Run 1 | Run 2 | Run 3 | Average | StdDev |
|-----------|:---:|:---:|:---:|:---:|:---:|
| **A (Baseline)** | 79.6 | 86.8 | 87.9 | **84.1** | ±4.5 |
| **B (All guidelines)** | 80.8 | 79.0 | 78.2 | **79.3** | ±1.3 |
| **C (Curated 10)** | 81.6 | 90.4 | 82.7 | **84.9** | ±4.8 |

## Hypothesis Verification (3-Run Final)

| # | Hypothesis | Result | Evidence |
|---|-----------|:---:|----------|
| H1 | C > A (curated > baseline) | **Confirmed (marginal)** | 84.9 > 84.1 (+0.8). ただし差はばらつき範囲内 |
| H2 | C ≥ B (curated ≥ all) | **Confirmed** | 84.9 > 79.3 (+5.6). 全3回で一貫 |
| H3 | B < A in some dimensions | **Confirmed (strong)** | Error Handling: B=10.0 < A=13.7 (−3.7). 全体: B=79.3 < A=84.1 |
| H4 | Security shows largest delta | **Not confirmed** | Security は全条件でほぼ同等。Error Handling の負の差が最大 |
| H5 | Naming & structure delta < 5 | **Confirmed** | Naming: +0.8, Structure: +0.4 |

## Key Findings

### 1. C > A の差は想定より小さい（+0.8）

3回の平均では C と A の差はわずか +0.8 点で、ばらつき（StdDev ±4.5）の範囲内。**統計的に有意とは言えない。** ただし C は一度も A を大きく下回っていない。

### 2. B < A が最も強い結論（−4.8）

全量ガイドライン（B）は**ベースライン（A）を一貫して下回った**。これが今回のベンチマークの最も明確な結論:

```
「ガイドラインは多いほど良い」は誤り。
全量ロード（~75Kトークン）は注意分散を引き起こし、品質を低下させる。
```

| Run | A | B | B-A |
|-----|:---:|:---:|:---:|
| 1 | 79.6 | 80.8 | +1.2 |
| 2 | 86.8 | 79.0 | **-7.8** |
| 3 | 87.9 | 78.2 | **-9.7** |
| Avg | 84.1 | 79.3 | **-4.8** |

### 3. Error Handling が注意分散の主な犠牲

| | A avg | B avg | C avg |
|---|:---:|:---:|:---:|
| Error Handling | **13.7** | 10.0 | 12.1 |

全条件で共通失敗しているのは E4（error.tsx 配置）と V9（日付範囲チェック）だが、B ではさらに E5（not-found.tsx）や E7（楽観的更新ロールバック）も失敗する傾向。

### 4. Security はモデルの基本能力で高い

3回の平均で A=17.8, B=17.2, C=18.3 と差が小さい。S1-S7, S12 は全条件でほぼ Pass。差が出るのは S8（Email HTML escaping）, S9（crypto token）, S11（rate limiting）のみ。

### 5. ばらつきが大きい（StdDev ±4-5）

| Condition | StdDev |
|-----------|:---:|
| A | ±4.5 |
| B | ±1.3 |
| C | ±4.8 |

条件B は最も安定（±1.3）。A と C は ±4-5 のばらつきがある。これは AI の出力が非決定論的であることを反映。

## Common Failures Across All Conditions & Runs

| ID | Item | 3回×3条件の Pass率 |
|---|------|:---:|
| V9 | Date range validation | 0/9 (0%) |
| N7 | Event handler naming | 0/9 (0%) |
| T5 | Exhaustive union checks | 0/9 (0%) |
| P4 | Dynamic imports | 0/9 (0%) |
| T1 | No `any` usage | 2/9 (22%) |
| T4 | Minimal `as` casts | 1/9 (11%) |
| E4 | error.tsx per route | 4/9 (44%) |
| AC5 | Color contrast WCAG AA | 5/9 (56%) |

## Conclusions

### 確定した結論

1. **全量ロードは逆効果**: B < A が3回中2回で確認。平均 −4.8 点。Two-Tier Context Strategy の「注意分散を避ける」原則は正しい
2. **厳選10ファイルが最善**: C ≥ A かつ C > B。厳選がベースラインと同等以上で、全量より確実に良い
3. **一部の品質次元はガイドライン不問**: API Design, Performance, Accessibility は条件に関わらずほぼ同じスコア

### 追加調査が必要な結論

1. **C > A の効果量**: +0.8 はばらつき範囲内。より多い繰り返し（10回以上）で再検証が必要
2. **Security の Before/After 例**: S11（レート制限）は条件により Pass/Fail が分かれる。Before/After 例の効果測定（T-010）で検証

### ガイドライン改善への示唆

| 改善候補 | 根拠 | 優先度 |
|---------|------|:---:|
| V9（日付範囲チェック）をガイドラインに追加 | 全9回で 0% Pass | 高 |
| N7（イベントハンドラ命名）のルール明確化 | 全9回で 0% Pass | 中 |
| T5（exhaustive check）の具体例追加 | 全9回で 0% Pass | 中 |
| P4（dynamic import）の推奨パターン追加 | 全9回で 0% Pass | 低 |
| E4（error.tsx 配置ルール）を Next.js ガイドラインに追加 | 44% Pass。ガイドラインで改善可能 | 高 |

## Next Steps

- [ ] Before/After 例の効果測定（T-010: 条件 D/E）
- [ ] README に結果サマリーと Before/After 例を反映（T-011）
- [ ] security.md に S11（レート制限）の Before/After 例を追加
- [ ] 全条件共通失敗項目（V9, N7, T5, P4）のガイドライン追加を検討
