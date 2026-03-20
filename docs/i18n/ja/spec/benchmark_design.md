# AI Dev OS 3条件ベンチマーク — 詳細設計書

> 作成日: 2026-03-19
> 切り出し元: [SNS戦略・プロフィール修正案 §7](./sns_strategy_profile.md#7-beforeafter-ベンチマーク設計)
> 関連: [チェックリスト形式 試験導入計画](./checklist_trial_plan.md) / [エコシステムレビュー R-1, M-6](./ecosystem_review.md)

---

## 目次

1. [ベンチマークの全体像](#1-ベンチマークの全体像)
2. [3条件の定義](#2-3条件の定義)
3. [要件定義書（ベンチマーク用アプリ）](#3-要件定義書ベンチマーク用アプリ)
4. [評価項目と採点基準](#4-評価項目と採点基準)
5. [想定チェック内容（項目別）](#5-想定チェック内容項目別)
6. [Before/After 例の追加計画と測定方法](#6-beforeafter-例の追加計画と測定方法)
7. [README 冒頭 Before/After コード例の具体案](#7-readme-冒頭-beforeafter-コード例の具体案)
8. [60秒デモGIF の内容設計](#8-60秒デモgif-の内容設計)
9. [実施手順と再現性の確保](#9-実施手順と再現性の確保)
10. [結果の活用先](#10-結果の活用先)
11. [security.md チェックリスト形式ベンチマーク](#11-securitymd-チェックリスト形式ベンチマーク)

---

## 1. ベンチマークの全体像

### 1.1 目的

| 目的 | 詳細 |
|------|------|
| **定量的証明** | AI Dev OS の有無で AI コーディングの品質にどれだけ差が出るかを数値で示す |
| **最適なルール量の特定** | 「全量読み込み」vs「厳選」のどちらが効果的かを実測する |
| **Before/After コンテンツの素材** | README、記事、デモGIF に使う具体的なコード差分を取得する |
| **正直な分析** | ガイドラインが逆効果になるケースも含めて報告し、信頼性を確保する |

### 1.2 ベンチマーク構成の全体図

```
┌──────────────────────────────────────────────────────────────┐
│                   ベンチマーク全体像                          │
│                                                              │
│  【入力】同一の要件定義書（タスク管理アプリ）                │
│     │                                                        │
│     ├── 条件A: 要件定義書のみ                                │
│     ├── 条件B: 要件定義書 + 全ガイドライン（33ファイル）     │
│     └── 条件C: 要件定義書 + 厳選ガイドライン（10ファイル）   │
│                                                              │
│  【出力】3つの実装成果物                                     │
│     │                                                        │
│     └── 9項目100点満点で採点                                 │
│         ├── レーダーチャートで可視化                          │
│         ├── 項目別のコード diff を抽出                        │
│         └── 統計的な差の検証（3回繰り返し）                  │
│                                                              │
│  【副産物】                                                  │
│     ├── README 用 Before/After コード例                      │
│     ├── 60秒デモGIF の素材                                   │
│     ├── 記事用のコード差分・チャート                         │
│     └── Before/After 例が不足するガイドラインの特定          │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 3条件の定義

### 2.1 条件一覧

| 条件 | コンテキストに含めるもの | トークン目安 | 狙い |
|------|------------------------|-------------|------|
| **A: ベースライン** | 要件定義書のみ | 約 2,000 | ガイドラインなしの「素」の出力品質を測定 |
| **B: 全量読み込み** | 要件定義書 + 全33ガイドライン | 約 25,000-30,000 | 「多ければ良い」が正しいかを検証 |
| **C: 厳選10ファイル** | 要件定義書 + Two-Tier Strategy 準拠の厳選セット | 約 8,000-10,000 | AI Dev OS 推奨構成の実力を測定 |

### 2.2 条件C の厳選ファイル選定

**選定基準:** 評価項目の配点が高い × AI が頻繁に間違える × フレームワーク固有の重要パターン

| # | ファイル | 選定理由 | 対応する評価項目 |
|---|---------|---------|----------------|
| 1 | `ai-coding.md` | Two-Tier 戦略の核。Common AI Pitfalls テーブル | 全項目横断 |
| 2 | `security.md` | 配点最大（20点）。AI が最も見落とす領域 | セキュリティ |
| 3 | `error-handling.md` | ActionResult パターン。統一エラーハンドリング | エラーハンドリング |
| 4 | `validation.md` | クライアント+サーバー両面。Zod スキーマ設計 | バリデーション |
| 5 | `server-actions.md` | Next.js 固有の重要パターン | エラーハンドリング、型安全性 |
| 6 | `api.md` | API 設計の統一フォーマット | API 設計 |
| 7 | `naming.md` | 一貫性は AI が最も苦手な領域 | 命名規則の一貫性 |
| 8 | `project-structure.md` | ディレクトリ構成の標準化 | ディレクトリ構成 |
| 9 | `code.md` | strict TypeScript、any 禁止 | 型安全性 |
| 10 | `auth.md` | 認証・認可パターン。セキュリティとの重複回避 | セキュリティ |

### 2.3 検証したい仮説

| # | 仮説 | 検証方法 |
|---|------|---------|
| H1 | C > A（厳選ガイドラインはベースラインより高品質） | C の合計点 > A の合計点 |
| H2 | C ≥ B（厳選は全量と同等かそれ以上） | C の合計点 ≥ B の合計点 |
| H3 | B の一部項目で A より悪化する（注意分散の証拠） | B < A となる項目が1つ以上存在 |
| H4 | セキュリティ・バリデーションで最大の差が出る | これらの項目の差分 > 他項目の差分 |
| H5 | 命名規則・ディレクトリ構成では差が小さい | これらの項目の差分 < 5点 |

---

## 3. 要件定義書（ベンチマーク用アプリ）

### 3.1 アプリ概要

**タスク管理アプリ（Todo App 拡張版）** — 差が出やすい要件を意図的に含む設計。

### 3.2 技術スタック

| 技術 | バージョン |
|------|-----------|
| Next.js | 15 (App Router) |
| TypeScript | 5.x (strict mode) |
| Prisma | 6.x + PostgreSQL |
| NextAuth.js | v5 |
| Tailwind CSS | 4.x + shadcn/ui |
| Zod | 3.x |

### 3.3 機能要件

#### F1: ユーザー認証

| 機能 | 差が出やすいポイント |
|------|---------------------|
| メール/パスワード新規登録 | パスワードハッシュ化、バリデーション |
| ログイン/ログアウト | セッション管理、CSRF 対策 |
| パスワードリセット（メール） | トークン管理、有効期限、HTMLエスケープ |
| セッション管理 | Cookie 設定（SameSite, Secure, HttpOnly） |

#### F2: タスク管理（CRUD）

| 機能 | 差が出やすいポイント |
|------|---------------------|
| タスク作成 | Server Action + ActionResult パターン |
| 一覧表示（フィルタ・ソート） | N+1 クエリ防止、ページネーション |
| 編集・削除 | IDOR 防止（リソース所有者チェック） |
| ステータス変更 | 楽観的 UI 更新、競合制御 |
| 検索 | SQLインジェクション防止 |

#### F3: カテゴリ管理

| 機能 | 差が出やすいポイント |
|------|---------------------|
| CRUD | 入力バリデーション（カラーコード形式） |
| 色分け表示 | XSS 防止（ユーザー入力の色値） |

#### F4: チーム機能

| 機能 | 差が出やすいポイント |
|------|---------------------|
| チーム作成 | 権限モデル設計（RBAC） |
| メンバー招待（メール） | 招待トークン、メールテンプレートの安全性 |
| タスク共有・アサイン | 認可チェック（チームメンバーか確認） |
| 権限管理 | オーナー / メンバー / 閲覧者の3段階 |

#### F5: API 設計

| 機能 | 差が出やすいポイント |
|------|---------------------|
| RESTful API | URL 設計、HTTP メソッドの適切な使用 |
| エラーレスポンス | 統一フォーマット、内部情報の非漏洩 |
| ページネーション | カーソルベース vs オフセットベース |
| レート制限 | エンドポイント別の設定 |

### 3.4 非機能要件

| 要件 | 差が出やすいポイント |
|------|---------------------|
| レスポンシブデザイン | Tailwind のブレイクポイント一貫性 |
| ローディング/エラー状態 | Suspense/ErrorBoundary の適切な使用 |
| 入力バリデーション | クライアント + サーバー両面 |
| アクセシビリティ | aria 属性、キーボード操作 |

---

## 4. 評価項目と採点基準

### 4.1 採点マトリクス

| # | 評価項目 | 配点 | 重み付け理由 |
|---|---------|------|-------------|
| 1 | セキュリティ | 20 | AI が最も見落とす + 影響が最大 |
| 2 | エラーハンドリング | 15 | ActionResult パターンの適用有無で大差 |
| 3 | バリデーション | 15 | 両面バリデーションの有無で大差 |
| 4 | 命名規則の一貫性 | 10 | ファイル間の一貫性は AI の弱点 |
| 5 | ディレクトリ構成 | 10 | 標準構成への準拠度 |
| 6 | API 設計 | 10 | RESTful 準拠、レスポンス形式の統一 |
| 7 | 型安全性 | 10 | any の使用数、型定義の網羅性 |
| 8 | パフォーマンス | 5 | N+1 クエリ、不要な re-render |
| 9 | アクセシビリティ | 5 | aria 属性、キーボード操作 |
| | **合計** | **100** | |

### 4.2 採点基準の詳細（5段階）

各項目を以下の5段階で採点し、配点に按分する。

| スコア | 基準 | 意味 |
|--------|------|------|
| 5 | 全チェック項目を満たす | 完璧 |
| 4 | 80%以上のチェック項目を満たす | ほぼ完璧 |
| 3 | 60-79%のチェック項目を満たす | 許容範囲 |
| 2 | 40-59%のチェック項目を満たす | 不十分 |
| 1 | 40%未満のチェック項目を満たす | 重大な問題 |

**計算式:** `項目得点 = (スコア / 5) × 配点`

---

## 5. 想定チェック内容（項目別）

### 5.1 セキュリティ（20点）

| # | チェック項目 | 該当機能 | AI がよく見落とすか |
|---|-------------|---------|-------------------|
| S1 | パスワードが bcrypt/argon2 でハッシュ化されているか | F1 | ★★☆ |
| S2 | CSRF 対策が実装されているか（SameSite Cookie or トークン） | F1 | ★★★ |
| S3 | セッション Cookie に `Secure`, `HttpOnly`, `SameSite=Lax` が設定されているか | F1 | ★★★ |
| S4 | パスワードリセットトークンに有効期限があるか | F1 | ★★☆ |
| S5 | SQL インジェクション対策（Prisma のパラメータ化クエリ使用） | F2 | ★☆☆ |
| S6 | IDOR 防止: タスク操作時にリソース所有者チェックがあるか | F2 | ★★★ |
| S7 | XSS 防止: ユーザー入力のエスケープ処理があるか | F3 | ★★☆ |
| S8 | 招待メールテンプレートで HTML エスケープされているか | F4 | ★★★ |
| S9 | 招待トークンが暗号的に安全なランダム値か | F4 | ★★☆ |
| S10 | API エラーレスポンスに内部情報（stack trace, error.message）が含まれないか | F5 | ★★★ |
| S11 | レート制限が認証エンドポイントに適用されているか | F5 | ★★★ |
| S12 | 環境変数で秘密情報を管理しているか（ハードコードなし） | 全体 | ★☆☆ |

### 5.2 エラーハンドリング（15点）

| # | チェック項目 | 該当機能 | AI がよく見落とすか |
|---|-------------|---------|-------------------|
| E1 | Server Action が ActionResult パターン（`{ success, data, error }`）を返すか | F2 | ★★★ |
| E2 | try-catch が適切な粒度か（関数全体を囲まない） | 全体 | ★★☆ |
| E3 | エラーメッセージがユーザー向けとログ向けで分離されているか | 全体 | ★★★ |
| E4 | Next.js の `error.tsx` が各ルートセグメントに配置されているか | 全体 | ★★☆ |
| E5 | `not-found.tsx` が適切に配置されているか | 全体 | ★☆☆ |
| E6 | データベースエラー時のフォールバックが実装されているか | F2 | ★★☆ |
| E7 | 楽観的更新の失敗時にロールバック処理があるか | F2 | ★★★ |
| E8 | API レスポンスのエラーフォーマットが統一されているか | F5 | ★★☆ |

### 5.3 バリデーション（15点）

| # | チェック項目 | 該当機能 | AI がよく見落とすか |
|---|-------------|---------|-------------------|
| V1 | Zod スキーマがサーバーサイドで定義されているか | 全体 | ★☆☆ |
| V2 | 同一の Zod スキーマがクライアント・サーバーで共有されているか | 全体 | ★★★ |
| V3 | フォームバリデーションがクライアント側でも動作するか | F1, F2 | ★★☆ |
| V4 | メールアドレスの形式チェックがあるか | F1 | ★☆☆ |
| V5 | パスワード強度チェックがあるか（最小長、複雑性） | F1 | ★★☆ |
| V6 | カラーコードのバリデーションがあるか | F3 | ★★★ |
| V7 | ページネーションパラメータのバリデーションがあるか | F5 | ★★★ |
| V8 | 検索クエリの長さ制限があるか | F2 | ★★★ |
| V9 | 日付の形式・範囲チェックがあるか（期限設定） | F2 | ★★☆ |

### 5.4 命名規則の一貫性（10点）

| # | チェック項目 | AI がよく見落とすか |
|---|-------------|-------------------|
| N1 | ファイル名が kebab-case で統一されているか | ★★☆ |
| N2 | コンポーネント名が PascalCase で統一されているか | ★☆☆ |
| N3 | 変数・関数名が camelCase で統一されているか | ★☆☆ |
| N4 | データベースカラム名が snake_case で統一されているか | ★★☆ |
| N5 | API エンドポイントが kebab-case で統一されているか | ★★☆ |
| N6 | Boolean 変数が `is`, `has`, `can` で始まるか | ★★☆ |
| N7 | イベントハンドラが `handle` + 名詞 + 動詞か | ★★★ |
| N8 | Server Action が動詞始まりか（`createTask`, `updateTask`） | ★★☆ |

### 5.5 ディレクトリ構成（10点）

| # | チェック項目 | AI がよく見落とすか |
|---|-------------|-------------------|
| D1 | App Router の構成が適切か（`app/`, `(group)/` 使用） | ★☆☆ |
| D2 | features/ ディレクトリで機能別に分離されているか | ★★★ |
| D3 | 共通コンポーネントが `components/ui/` に配置されているか | ★★☆ |
| D4 | Server Action が `actions/` または `app/**/actions.ts` に配置されているか | ★★☆ |
| D5 | Prisma スキーマが `prisma/schema.prisma` にあるか | ★☆☆ |
| D6 | Zod スキーマが Server Action / API Route と同じディレクトリにあるか | ★★★ |
| D7 | lib/ ディレクトリの責務が明確か（ユーティリティ vs ビジネスロジック） | ★★★ |

### 5.6 API 設計（10点）

| # | チェック項目 | AI がよく見落とすか |
|---|-------------|-------------------|
| A1 | URL が RESTful（`/api/v1/tasks`, `/api/v1/teams/:id/members`）か | ★★☆ |
| A2 | HTTP メソッドが適切か（GET=読取, POST=作成, PUT=更新, DELETE=削除） | ★☆☆ |
| A3 | レスポンス形式が統一されているか（`{ data, error, meta }` 等） | ★★★ |
| A4 | HTTP ステータスコードが適切か（201 Created, 404 Not Found 等） | ★★☆ |
| A5 | ページネーションが実装されているか | ★★☆ |
| A6 | Content-Type が適切に設定されているか | ★☆☆ |
| A7 | 認証が必要なエンドポイントで認証チェックがあるか | ★★☆ |

### 5.7 型安全性（10点）

| # | チェック項目 | AI がよく見落とすか |
|---|-------------|-------------------|
| T1 | `any` が使われていないか | ★★★ |
| T2 | API レスポンスの型が定義されているか | ★★☆ |
| T3 | Prisma の型が活用されているか（手動型定義の重複なし） | ★★☆ |
| T4 | `as` によるキャストが最小限か | ★★★ |
| T5 | Union 型の exhaustive check（never チェック）があるか | ★★★ |
| T6 | `null` / `undefined` の扱いが明示的か（`??` `?.` の適切使用） | ★★☆ |

### 5.8 パフォーマンス（5点）

| # | チェック項目 | AI がよく見落とすか |
|---|-------------|-------------------|
| P1 | N+1 クエリが発生しないか（Prisma の `include` / `select` 使用） | ★★☆ |
| P2 | `use client` が必要最小限のコンポーネントのみに付与されているか | ★★★ |
| P3 | 画像に `next/image` が使用されているか | ★☆☆ |
| P4 | 重いコンポーネントに `React.lazy` / dynamic import が使用されているか | ★★★ |

### 5.9 アクセシビリティ（5点）

| # | チェック項目 | AI がよく見落とすか |
|---|-------------|-------------------|
| AC1 | フォーム要素に `<label>` が紐付けられているか | ★★☆ |
| AC2 | ボタンに適切な `aria-label` があるか（アイコンボタン） | ★★★ |
| AC3 | モーダル/ダイアログに `role="dialog"` と `aria-modal` があるか | ★★★ |
| AC4 | キーボードのみで全操作が可能か | ★★★ |
| AC5 | カラーコントラストが WCAG AA 基準を満たすか | ★★★ |

---

## 6. Before/After 例の追加計画と測定方法

### 6.1 現状の Before/After 例カバレッジ

ベンチマーク実施と並行して、Before/After 例がまだ追加されていないガイドラインを特定し、効果を測定する。

#### 6.1.1 カバレッジ調査対象

| ファイル | Before/After 例 | 優先度 |
|---------|-----------------|--------|
| `common/security.md` | 要確認 | ★★★（配点最大） |
| `common/error-handling.md` | 要確認 | ★★★ |
| `common/validation.md` | 要確認 | ★★★ |
| `common/naming.md` | 要確認 | ★★☆ |
| `common/code.md` | 要確認 | ★★☆ |
| `common/performance.md` | 要確認 | ★☆☆ |
| `common/logging.md` | 要確認 | ★☆☆ |
| `common/testing.md` | 要確認 | ★☆☆ |
| `common/i18n.md` | 要確認 | ★☆☆ |
| `common/cors.md` | 要確認 | ★☆☆ |
| `common/env.md` | 要確認 | ★☆☆ |
| `common/rate-limiting.md` | 要確認 | ★☆☆ |
| `common/cicd.md` | 要確認 | ☆☆☆ |
| `frameworks/nextjs/overview.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/project-structure.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/routing.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/api.md` | 要確認 | ★★☆ |
| `frameworks/nextjs/server-actions.md` | 要確認 | ★★★ |
| `frameworks/nextjs/client-hooks.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/form.md` | 要確認 | ★★☆ |
| `frameworks/nextjs/state.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/ui.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/auth.md` | 要確認 | ★★☆ |
| `frameworks/nextjs/database.md` | 要確認 | ★★☆ |
| `frameworks/nextjs/middleware.md` | 要確認 | ★☆☆ |
| `frameworks/nextjs/format.md` | 要確認 | ☆☆☆ |
| `frameworks/nextjs/build.md` | 要確認 | ☆☆☆ |

### 6.2 Before/After 例の追加効果測定方法

#### 6.2.1 測定設計（A/B テスト方式）

Before/After 例を追加した場合と追加しない場合で、AI の出力品質がどう変わるかを測定する。

```
┌──────────────────────────────────────────────────────────┐
│  Before/After 例の効果測定                                │
│                                                          │
│  【対象ガイドライン】security.md を最初の測定対象にする   │
│                                                          │
│  【2条件】                                               │
│   D: ガイドライン（Before/After 例なし版）               │
│   E: ガイドライン（Before/After 例あり版）               │
│                                                          │
│  【手順】                                                │
│   1. 同一プロンプトで D, E それぞれにコード生成を依頼    │
│   2. 生成コードをチェック項目で採点                       │
│   3. D と E の差分を分析                                  │
│   4. Before/After 例が AI の出力に影響したかを確認       │
│                                                          │
│  【期待値】                                              │
│   - Before/After 例が含む特定パターンの遵守率が向上      │
│   - 例: IDOR 防止の Before/After → S6 チェックの通過率↑  │
└──────────────────────────────────────────────────────────┘
```

#### 6.2.2 具体的な測定手順

| ステップ | 内容 | 詳細 |
|---------|------|------|
| 1 | **対象ガイドラインの選定** | security.md から開始（配点最大・チェック項目12個） |
| 2 | **Before/After 例なし版の準備** | 現状のガイドラインをそのまま使用 |
| 3 | **Before/After 例あり版の作成** | チェック項目 S1-S12 に対応する Before/After コード例を追加 |
| 4 | **プロンプトの作成** | security.md のルールが適用される5つのタスクを定義（§5.1 の S1-S12 から選択） |
| 5 | **条件D で実行** | 各タスクを3回ずつ実行、チェック項目で採点 |
| 6 | **条件E で実行** | 同上 |
| 7 | **採点・比較** | 項目別の遵守率を比較 |
| 8 | **判定** | 遵守率が10%以上向上 → 効果あり |

#### 6.2.3 測定プロンプト例（security.md 用）

| # | タスク | 主に測定するチェック項目 |
|---|--------|------------------------|
| 1 | 「ユーザーのプロファイル更新 Server Action を作成してください」 | S6 (IDOR), V2 (両面バリデーション) |
| 2 | 「パスワードリセットメール送信機能を実装してください」 | S4 (トークン有効期限), S8 (HTMLエスケープ), S9 (安全なトークン) |
| 3 | 「タスク検索 API エンドポイントを作成してください」 | S5 (SQLi), S10 (情報漏洩), S11 (レート制限) |
| 4 | 「ログインエンドポイントを実装してください」 | S1 (ハッシュ化), S2 (CSRF), S3 (Cookie設定), S11 (レート制限) |
| 5 | 「チームメンバー招待メール送信機能を実装してください」 | S8 (HTMLエスケープ), S9 (安全なトークン), S12 (環境変数) |

#### 6.2.4 Before/After 例の作成ガイドライン

良い Before/After 例の条件:

```
✅ 良い例:
- Before がリアル（AI が実際に生成しそうなコード）
- After が具体的（何をどう変えたかが明確）
- 差分が最小限（1-3行の変更で効果が見える）
- コメントで「なぜ」を説明

❌ 悪い例:
- Before が極端に悪い（誰も書かないようなコード）
- After が長すぎる（10行超のコード差分）
- Before と After の差が大きすぎて何が重要か分からない
```

例:

```typescript
// ❌ Before: AI が実際に生成するコード
export async function updateProfile(formData: FormData) {
  const userId = formData.get("userId") as string;
  await db.user.update({
    where: { id: userId },
    data: { name: formData.get("name") as string },
  });
}

// ✅ After: IDOR 防止 + バリデーション追加
export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  // ✅ セッションの userId を使用（フォームの userId を信用しない）
  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });
  return { success: true, data: null };
}
```

#### 6.2.5 評価基準

| 結果 | 判定 | 次のアクション |
|------|------|---------------|
| Before/After 例ありで遵守率 **+10%以上** | **効果大** | 全ガイドラインに Before/After 例を追加 |
| Before/After 例ありで遵守率 **+5-10%** | **効果あり** | 配点10点以上のガイドラインに優先追加 |
| Before/After 例ありで遵守率 **+5%未満** | **効果なし** | Before/After 例の追加は見送り。他のアプローチを検討 |

#### 6.2.6 3条件ベンチマークとの統合

Before/After 例の測定は、3条件ベンチマーク（A/B/C）と組み合わせて実施できる:

```
                3条件ベンチマーク
                ┌─────────────┐
                │ A: なし     │
                │ B: 全量     │ ← B, C に Before/After 例あり版を使用した
                │ C: 厳選     │   追加条件 B', C' を設ける
                └─────────────┘

    拡張（オプション）:
    B': 全量（Before/After 例なし版）  vs  B: 全量（Before/After 例あり版）
    C': 厳選（Before/After 例なし版）  vs  C: 厳選（Before/After 例あり版）

    → Before/After 例の効果を、ガイドライン量との交互作用で分析可能
```

ただし条件数が増えすぎるリスクがあるため、まず3条件（A/B/C）を実施し、結果を見てから Before/After 例の個別測定を実施する2段階方式を推奨。

---

## 7. README 冒頭 Before/After コード例の具体案

### 7.1 目的

エコシステムレビュー R-1 で指摘された「README が理論先行で『何が起きるか』が見えない」問題を解決する。

**現状の README 冒頭:**
```
4層モデル図 → 15の古典理論テーブル → 「学術プロジェクト」と判断して離脱
```

**目標:**
```
Before/After コード例（10行程度）→ 「おっ、具体的に品質が上がるんだ」→ 読み進める
```

### 7.2 具体案5パターン

#### 案1: セキュリティ（IDOR 防止）— 最も差が出やすい

```markdown
## What changes?

**Without AI Dev OS** — AI generates code that "works" but has security holes:
```typescript
// ❌ AI-generated: Anyone can update any user's profile
export async function updateProfile(userId: string, data: FormData) {
  await db.user.update({ where: { id: userId }, data: { name: data.get("name") } });
}
```

**With AI Dev OS** — Same prompt, but AI follows your security guidelines:
```typescript
// ✅ AI-generated: Ownership verified, input validated, result typed
export async function updateProfile(data: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const parsed = profileSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };
  await db.user.update({ where: { id: session.user.id }, data: parsed.data });
  return { success: true, data: null };
}
```

> The difference isn't luck — it's [L3 guidelines](./spec/4-layer-model.md) that encode your team's security practices into enforceable rules.
```

**選定理由:** セキュリティは全エンジニアに刺さる。IDOR は深刻だが見落とされやすく、ガイドラインの効果が一目でわかる。

---

#### 案2: エラーハンドリング（ActionResult パターン）

```markdown
## What changes?

**Without AI Dev OS:**
```typescript
// ❌ try-catch hell, inconsistent error shapes
export async function createTask(data: FormData) {
  try {
    const task = await db.task.create({ data: { title: data.get("title") } });
    return task;
  } catch (e) {
    throw new Error("Failed to create task: " + e.message); // 💀 leaks internal info
  }
}
```

**With AI Dev OS:**
```typescript
// ✅ Typed ActionResult, no internal leak, consistent shape
export async function createTask(data: FormData): Promise<ActionResult<Task>> {
  const parsed = createTaskSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: "Invalid input" };
  const task = await db.task.create({ data: parsed.data });
  return { success: true, data: task };
}
```
```

**選定理由:** Server Action は Next.js ユーザーに直球。ActionResult パターンは AI Dev OS の具体的な価値。

---

#### 案3: バリデーション（片面 → 両面）

```markdown
## What changes?

**Without AI Dev OS:**
```typescript
// ❌ Client-only validation — server trusts raw input
<input type="email" required />
// Server Action:
export async function invite(data: FormData) {
  await sendInvite(data.get("email") as string); // 💀 no server-side check
}
```

**With AI Dev OS:**
```typescript
// ✅ Shared Zod schema — validated on both sides
const inviteSchema = z.object({ email: z.string().email().max(255) });

// Client: <Form schema={inviteSchema} />
// Server:
export async function invite(data: FormData): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: "Invalid email" };
  await sendInvite(parsed.data.email);
  return { success: true, data: null };
}
```
```

**選定理由:** 「クライアントだけバリデーション」は初学者～中級者がよくやるミス。共有スキーマが新鮮。

---

#### 案4: 命名規則の一貫性

```markdown
## What changes?

**Without AI Dev OS** — AI generates inconsistent naming across files:
```typescript
// File 1: camelCase
const userData = await fetchUser(userId);
// File 2: snake_case
const task_list = await get_tasks(user_id);
// File 3: PascalCase for non-components
const TaskService = { GetAll: () => {} };
// API: mixed
GET /api/getUserTasks    // ❌ camelCase
POST /api/create-task    // ❌ kebab-case (inconsistent with above)
```

**With AI Dev OS:**
```typescript
// All files: consistent conventions
const userData = await fetchUser(userId);     // ✅ camelCase for variables
const taskList = await getTasks(userId);      // ✅ same
GET /api/v1/users/:id/tasks                   // ✅ RESTful, kebab-case
POST /api/v1/tasks                            // ✅ consistent
```
```

**選定理由:** 命名の一貫性はコードレビューで最も指摘される項目の1つ。視覚的に差が明らか。

---

#### 案5: 複合（最も効果的、推奨）

```markdown
## What changes?

Same prompt. Same AI model. Different output quality.

| Aspect | Without AI Dev OS | With AI Dev OS |
|--------|------------------|----------------|
| Security | `userId` from form input (IDOR) | `session.user.id` from auth |
| Validation | Client-only `required` | Shared Zod schema, both sides |
| Error handling | `throw new Error(e.message)` | `ActionResult<T>` typed return |
| Naming | `get_tasks` / `GetAll` / `fetchUser` | Consistent `camelCase` everywhere |
| API errors | `{ message: error.stack }` | `{ error: "Not found" }` (no leak) |

> AI Dev OS doesn't replace your AI assistant — it gives it your team's **tacit knowledge** as explicit, enforceable rules.
```

**選定理由:** テーブル形式で5つの差を一覧表示。読者が「自分のコードにも当てはまる」と感じやすい。

### 7.3 推奨構成

**採用候補の優先度:**

| 優先度 | 案 | 理由 |
|--------|---|------|
| 1位 | **案5（複合テーブル）** | 1つの図で複数の価値を一覧表示。スクロール量最小 |
| 2位 | **案1（セキュリティ）** | 最も深刻な問題を具体コードで示す。説得力が高い |
| 3位 | **案1 + 案5 を組み合わせ** | コード例（案1）→ テーブル（案5）→ 詳細は下方 |

**README 構成の変更イメージ:**

```markdown
# AI Dev OS

> Write coding rules once, enforce across Claude Code / Cursor / Kiro.

## What changes?              ← NEW: 最初に Before/After
（案5 のテーブル or 案1 のコード例）

## Quick Start                ← 2番目: すぐ試せる
（3ステップのインストール手順）

## How it works               ← 3番目: 仕組みの概要
（4層モデルの簡潔な説明）

## Ecosystem                  ← 4番目: リポジトリ一覧
（7リポジトリの役割）

## Theory                     ← 下方に移動: 理論に興味がある人向け
（古典理論テーブル等）
```

---

## 8. 60秒デモGIF の内容設計

### 8.1 デモGIF の目的

| 目的 | 詳細 |
|------|------|
| **即時理解** | README を開いた瞬間に「何ができるか」を視覚的に伝える |
| **操作感の伝達** | テキストでは伝わらない「実際の開発体験」を見せる |
| **行動喚起** | 「自分もやってみたい」と思わせて Quick Start へ誘導 |

### 8.2 デモGIF の構成案（5パターン）

#### パターン A: セットアップ → コード生成 → チェック（推奨）

**概要:** 0 → 動くまでの全体フローを60秒で見せる

```
[0:00-0:10] セットアップ
  $ git submodule add ... .ai-dev-os/rules
  $ git submodule add ... .ai-dev-os/plugin
  ✔ Added submodules

[0:10-0:30] AI にコード生成を依頼（Claude Code のチャット画面）
  User: "Create a user profile update Server Action"
  AI: （コードが生成される様子 — 5秒早送り）
  → ActionResult パターン、IDOR 防止、Zod バリデーション付きのコードが出力

[0:30-0:50] チェックコマンドの実行
  User: /ai-dev-os-check
  AI:
    ✔ Security: IDOR prevention verified
    ✔ Validation: Zod schema shared between client/server
    ✔ Error handling: ActionResult pattern used
    ⚠ Performance: Consider adding React.cache()

    Score: 9/10 guidelines passed

[0:50-0:60] 結果のサマリー
  テキストオーバーレイ:
  "Write rules once. Enforce across Claude Code / Cursor / Kiro."
  → github.com/yunbow/ai-dev-os
```

**採用理由:** init → 生成 → チェック の3段階で、エンドツーエンドの価値が伝わる。

---

#### パターン B: Before/After 比較

**概要:** 同じプロンプトで、ガイドラインあり/なしの出力を並べて比較

```
[0:00-0:05] タイトル: "Same prompt. Different quality."

[0:05-0:25] 左画面: Without AI Dev OS
  User: "Create login endpoint"
  AI: （コード生成 — 早送り）
  → try-catch で全体を囲む、レート制限なし、エラーメッセージに stack trace

[0:25-0:45] 右画面: With AI Dev OS
  User: "Create login endpoint"（同一プロンプト）
  AI: （コード生成 — 早送り）
  → ActionResult、レート制限、エラー情報の非漏洩、セッション Cookie 設定

[0:45-0:55] diff ハイライト
  左右の差分をハイライト表示

[0:55-0:60] CTA
  "Get started: npx ai-dev-os init"
```

---

#### パターン C: チェックコマンドのみにフォーカス

**概要:** `/ai-dev-os-check` の出力結果を中心に見せる。カスタムコマンドの価値を強調。

```
[0:00-0:10] 前提の説明（テキストオーバーレイ）
  "You wrote some code with AI. Is it good enough?"

[0:10-0:35] /ai-dev-os-check 実行
  User: /ai-dev-os-check
  AI:
    Checking against AI Dev OS guidelines...

    📋 Security (security.md)
      ✔ No hardcoded secrets
      ✔ IDOR prevention: resource ownership verified
      ✖ Rate limiting: not applied to /api/auth/login
      ✖ CSP nonce: missing in middleware

    📋 Error Handling (error-handling.md)
      ✔ ActionResult pattern used
      ✔ No internal error exposure
      ✖ Missing error.tsx in /app/dashboard/

    📋 Validation (validation.md)
      ✔ Zod schemas defined
      ✖ Client-side validation missing for invite form

    Summary: 6/10 passed | 4 issues found

    Suggested fixes:
    1. Add rate limiter to /api/auth/login (see security.md §3.2)
    2. Add CSP nonce middleware (see security.md §3.4)
    3. Create /app/dashboard/error.tsx
    4. Add client validation to InviteForm

[0:35-0:55] AI が修正を実行
  User: "Fix all 4 issues"
  AI: （修正コード生成 — 早送り）
  ✔ All 4 issues resolved

[0:55-0:60] 再チェック
  User: /ai-dev-os-check
  AI: Summary: 10/10 passed ✔
```

**採用理由:** `/ai-dev-os-check` の価値が最も具体的に伝わる。「チェック → 修正 → 再チェック」のサイクルがプロダクトの核心。

---

#### パターン D: スキャン結果のダッシュボード風表示

**概要:** `/ai-dev-os-scan` の全体スキャン結果を見せる

```
[0:00-0:10] プロジェクト全体をスキャン
  User: /ai-dev-os-scan
  AI: Scanning project against 28 guidelines...

[0:10-0:40] 結果表示
  ┌─────────────────────────────────────────────┐
  │  AI Dev OS Scan Report                      │
  │                                             │
  │  Files scanned: 47                          │
  │  Guidelines checked: 28                     │
  │                                             │
  │  ✔ Passed: 23 (82%)                        │
  │  ⚠ Warnings: 3                             │
  │  ✖ Violations: 2                           │
  │                                             │
  │  Top issues:                                │
  │  1. [CRITICAL] No rate limiting on auth     │
  │  2. [HIGH] Missing error boundary in 3 routes│
  │  3. [MEDIUM] Inconsistent naming in lib/    │
  └─────────────────────────────────────────────┘

[0:40-0:55] JSON 出力モード
  User: /ai-dev-os-scan --format json
  → CI/CD で使える JSON 出力が表示

[0:55-0:60] CTA
```

---

#### パターン E: 初期化ウィザード（将来の CLI 版）

**概要:** `npx ai-dev-os init` の対話的セットアップ

```
[0:00-0:40] CLI 初期化
  $ npx ai-dev-os init
  ? Select rules: typescript
  ? Select plugin: claude-code
  ✔ Added 3 submodules
  ✔ Generated CLAUDE.md
  ✔ Merged hooks

[0:40-0:60] 初回チェック実行
  → 即座に /ai-dev-os-check が動く様子
```

### 8.3 推奨パターンと優先度

| 優先度 | パターン | 理由 |
|--------|---------|------|
| **1位** | **C: チェックコマンドにフォーカス** | AI Dev OS の最もユニークな価値（チェック→修正→再チェック）を端的に伝える |
| **2位** | **A: セットアップ→生成→チェック** | 全体フローが見えるが、60秒に収めるのが難しい |
| **3位** | **B: Before/After 比較** | 視覚的なインパクトは大きいが、左右分割は小さい画面で見づらい |
| 保留 | D: スキャン | レポート画面は「見る」だけ。操作感が伝わりにくい |
| 将来 | E: CLI | CLI ツール開発後に作成 |

### 8.4 デモGIF 制作の技術的検討

| 項目 | 推奨 | 代替案 |
|------|------|--------|
| 録画ツール | [Terminalizer](https://github.com/faressoft/terminalizer) | [asciinema](https://asciinema.org/) + [svg-term](https://github.com/marionebl/svg-term-cli) |
| 形式 | GIF（GitHub README 互換） | SVG（軽量だが互換性の問題） |
| 解像度 | 80列 × 24行 | — |
| フォント | JetBrains Mono | Fira Code |
| 速度調整 | タイピングは高速（50ms/char）、結果表示は通常速度 | — |
| サイズ制限 | 5MB 以下（GitHub 推奨） | — |
| 色テーマ | One Dark（暗い背景、GitHub で映える） | Dracula |

### 8.5 デモGIF のスクリプト（パターン C 詳細版）

録画時に打つコマンドと、期待される出力を事前にスクリプト化する:

```yaml
# demo-script.yaml
title: "AI Dev OS — Check & Fix in 60 seconds"
theme: one-dark
cols: 100
rows: 28

frames:
  - type: text-overlay
    duration: 3s
    content: "You wrote code with AI. Is it following your rules?"

  - type: command
    delay: 1s
    input: "/ai-dev-os-check"
    typing_speed: 80ms

  - type: output
    delay: 500ms
    content: |
      Checking against AI Dev OS guidelines...

      📋 Security (security.md)
        ✔ No hardcoded secrets
        ✔ IDOR prevention: resource ownership verified
        ✖ Rate limiting: not applied to /api/auth/login
        ✖ CSP nonce: missing in middleware

      📋 Error Handling (error-handling.md)
        ✔ ActionResult pattern used
        ✔ No internal error exposure
        ✖ Missing error.tsx in /app/dashboard/

      📋 Validation (validation.md)
        ✔ Zod schemas defined
        ✖ Client-side validation missing for invite form

      Summary: 6/10 passed | 4 issues found

  - type: pause
    duration: 3s
    highlight: "4 issues found"

  - type: command
    delay: 1s
    input: "Fix all 4 issues"
    typing_speed: 60ms

  - type: output
    delay: 500ms
    speed: fast
    content: |
      I'll fix all 4 issues:

      1. Adding rate limiter to /api/auth/login...
         ✔ Created src/lib/rate-limit.ts
         ✔ Applied to /api/auth/login/route.ts

      2. Adding CSP nonce middleware...
         ✔ Updated src/middleware.ts

      3. Creating error boundary...
         ✔ Created app/dashboard/error.tsx

      4. Adding client-side validation...
         ✔ Updated components/InviteForm.tsx

  - type: command
    delay: 1s
    input: "/ai-dev-os-check"
    typing_speed: 80ms

  - type: output
    delay: 500ms
    content: |
      Checking against AI Dev OS guidelines...

      📋 Security: ✔ All passed
      📋 Error Handling: ✔ All passed
      📋 Validation: ✔ All passed

      Summary: 10/10 passed ✔

  - type: text-overlay
    duration: 3s
    content: |
      AI Dev OS — Write rules once, enforce everywhere.
      github.com/yunbow/ai-dev-os
```

---

## 9. 実施手順と再現性の確保

### 9.1 実施手順

```
Phase 1: 準備（1日）
  ├── [ ] 要件定義書の最終化（本ドキュメント §3 をベースに）
  ├── [ ] 3条件のコンテキストファイルを作成
  │     ├── A: requirements.md のみ
  │     ├── B: requirements.md + 全33ガイドライン
  │     └── C: requirements.md + 厳選10ガイドライン
  ├── [ ] 評価シートの作成（§5 のチェック項目をスプレッドシート化）
  └── [ ] 再現用のプロンプトテンプレートを作成

Phase 2: ベンチマーク実施（2-3日）
  ├── [ ] 条件A で実装（3回繰り返し）→ 採点
  ├── [ ] 条件B で実装（3回繰り返し）→ 採点
  ├── [ ] 条件C で実装（3回繰り返し）→ 採点
  ├── [ ] トークン消費量を記録
  └── [ ] 結果を集計・分析

Phase 3: Before/After 例の効果測定（1-2日）
  ├── [ ] Before/After 例がないガイドラインを特定（§6.1）
  ├── [ ] security.md に Before/After 例を追加
  ├── [ ] 条件D, E で測定（§6.2）
  └── [ ] 結果に基づき他ガイドラインへの展開を判定

Phase 4: 成果物の作成（1-2日）
  ├── [ ] README 用 Before/After 例の選定・配置（§7）
  ├── [ ] デモGIF の録画（§8）
  ├── [ ] レーダーチャートの作成
  ├── [ ] 記事用のコード差分の抽出
  └── [ ] ai-dev-os-benchmark リポジトリの作成（全コード公開）
```

### 9.2 再現性の確保

| 要素 | 方法 |
|------|------|
| モデル固定 | Claude Sonnet 4 (claude-sonnet-4-20250514) を使用。モデル ID を記録 |
| プロンプト固定 | 全プロンプトをテンプレートファイルとして保存 |
| Temperature | 0（決定的出力）。ただし 3回繰り返しでバラつきも測定 |
| ガイドラインバージョン | 使用した git commit hash を記録 |
| 評価者バイアス | チェックリストに基づく機械的採点。主観的項目は2名で独立採点 |

### 9.3 統計的信頼性

| 設計要素 | 値 |
|---------|---|
| 条件数 | 3 (A, B, C) |
| 繰り返し数 | 3回 / 条件 |
| 合計実行回数 | 9回（+ Before/After 測定で +6回 = 15回） |
| 評価項目 | 9項目 × 73チェック項目 |
| 有意差検定 | 3回の繰り返しでは統計的検定は困難。記述統計（平均、範囲）で報告 |

---

## 10. 結果の活用先

### 10.1 成果物と活用先のマッピング

| 成果物 | 活用先 | 対応する課題 |
|--------|--------|-------------|
| README 用 Before/After 例 | ai-dev-os コア README 冒頭 | R-1: 理論先行 |
| 60秒デモGIF | README トップ、X の固定ポスト | R-1: 「何が起きるか」が見えない |
| レーダーチャート | Zenn 記事⑤、X シェア用画像 | M-6: 実使用事例がない |
| 項目別コード差分 | Qiita 記事④⑤、Zenn 記事⑤ | M-6: Before/After がない |
| 3条件の合計スコア | 各リポジトリ README のバッジ | M-6: 定量的エビデンス |
| Before/After 例の効果測定結果 | ガイドライン改善ロードマップ | QW-1: 全 L3 に Before/After 追加 |
| ベンチマーク全コード | `ai-dev-os-benchmark` リポジトリ | 再現可能性の担保 |
| チェック項目リスト（§5） | `ai-dev-os-check` スキルの改善 | R-5: CI レベルの強制 |

### 10.2 記事への展開

| 記事 | ベンチマークからの素材 |
|------|---------------------|
| [Qiita] ④ セキュリティ脆弱性を減らす方法 | S1-S12 のチェック結果 + Before/After コード |
| [Zenn] ⑤ Before/After ベンチマーク公開 | レーダーチャート + 全項目の分析 |
| [Qiita] ⑧ ルール量の逆効果 | 条件B vs 条件C の比較データ |
| [X] 固定ポスト | レーダーチャート画像 + 60秒デモGIF |

### 10.3 チェックリスト形式ベンチマークとの関係

§11 の security.md チェックリスト形式ベンチマークと本ベンチマーク（§1-9）は以下の関係:

| 観点 | 本ベンチマーク（§1-9） | チェックリスト形式ベンチマーク（§11） |
|------|--------------|-------------------|
| 目的 | AI Dev OS 全体の効果測定 | YAML frontmatter / Quick Rules の効果測定 |
| 対象 | 全9評価項目 × 73チェック項目 | security.md の28ルールのみ |
| 条件 | A(なし) / B(全量) / C(厳選) | A(現状散文) / B(YAML追加) / C(YAML+Quick Rules) |
| 時期 | 先に実施 | 本ベンチマークの後に実施 |

**実施順序:**
1. 本ベンチマーク（3条件、§1-9）を先に実施 → AI Dev OS 全体の効果を確認
2. 結果を踏まえて、チェックリスト形式ベンチマーク（§11）の条件を調整
3. チェックリスト形式ベンチマーク（§11）を実施 → ガイドラインのフォーマット最適化

---

## 11. security.md チェックリスト形式ベンチマーク

> 統合元: [checklist_trial_plan.md](./checklist_trial_plan.md)
> 関連: [チェックリスト形式の検討](./checklist_first_analysis.md)

### 11.1 概要

security.md（505行、28ルール）に対し、YAML frontmatter とQuick Rules サマリーを追加した場合の AI 出力品質への効果を測定する。

**対象ファイル:** `ai-dev-os-rules-typescript/03_guidelines/common/security.md`

### 11.2 3条件の定義

| 条件 | 内容 | security.md の形式 |
|------|------|-------------------|
| **A: 現状** | 現在の散文形式（コントロール群） | 変更なし |
| **B: YAML のみ** | 方法A（YAML frontmatter）を追加 | YAML frontmatter + 既存本文 |
| **C: YAML + Quick Rules** | 方法A + 方法B を両方適用 | YAML frontmatter + Quick Rules サマリー + 既存本文 |

#### 方法A: YAML frontmatter（例）

```yaml
---
checklist:
  - severity: MUST
    rule: Never hardcode secrets (API keys, passwords, tokens)
    section: "1"
  - severity: MUST
    rule: Validate all user input at system boundaries with Zod
    section: "1"
  - severity: MUST
    rule: Verify resource ownership before access (IDOR prevention)
    section: "3"
  - severity: MUST
    rule: Verify webhook signatures before processing
    section: "3.3"
  - severity: MUST_NOT
    rule: Expose internal error details (stack traces, error.message) to users
    section: "3.7"
  - severity: MUST
    rule: Apply rate limiting to authentication and critical endpoints
    section: "3.2"
  # ... 全28ルールを列挙
---
```

#### 方法B: Quick Rules サマリー（例）

```markdown
# Security Guidelines

> **Quick Rules** (details below):
> - MUST: Never hardcode secrets — use env vars and secret management [§1](#1-fundamental-principles-zero-trust-architecture)
> - MUST: Validate all input with Zod [§1](#1-fundamental-principles-zero-trust-architecture)
> - MUST: Verify resource ownership (IDOR prevention) [§3.1](#31-idor-prevention-pattern)
> - MUST: Verify webhook signatures [§3.3](#33-webhook-security)
> - MUST NOT: Expose stack traces or error.message to users [§3.7](#37-error-page-information-leakage-prevention)
> - MUST: Apply rate limiting to auth endpoints [§3.2](#32-rate-limiting)
> - MUST: Use CSP nonce headers, prohibit unsafe-inline [§3.4](#34-csp-nonce-header)
> - MUST: Validate webhook certificate URLs against allowlist (SSRF prevention) [§3.5](#35-webhook-certificate-url-ssrf-prevention)
> - MUST: Escape user data in email templates [§3.6](#36-email-template-html-injection-prevention)
> - MUST: Use minimum DB privileges [§4](#4-database-security)
> - MUST: Patch Critical vulns (CVSS 9.0+) within 24h [§10](#10-cicd-security)

（以下、既存の詳細セクションをそのまま維持）
```

### 11.3 測定指標

| 指標 | 測定方法 | 期待値 |
|------|----------|--------|
| **AI 順守率** | 同一プロンプトで各条件のコードを生成し、セキュリティルール遵守数 / 該当ルール数を算出 | A: 60-75% → C: 80-90% |
| **違反の深刻度** | 生成コードの違反を Critical/High/Medium/Low に分類 | Critical 違反の減少 |
| **トークン消費量** | 各条件での入力トークン数を計測 | B: +12%, C: +15% |
| **Check/Scan 精度** | `ai-dev-os-check` の検出率（True Positive / False Positive） | B,C で TP 向上 |
| **メンテナンス工数** | ルール1件の追加・変更にかかる編集箇所数 | A: 1箇所, C: 2-3箇所 |

### 11.4 テストシナリオ（10タスク）

| # | タスク | チェック対象ルール |
|---|--------|-------------------|
| 1 | ユーザープロファイル更新 Server Action を作成 | IDOR防止、入力バリデーション |
| 2 | Webhook エンドポイントを作成 | 署名検証、リプレイ攻撃防止、SSRF防止 |
| 3 | ログインエンドポイントを作成 | レート制限、セッション管理、不審ログイン検知 |
| 4 | 管理画面の API Route を作成 | RBAC、IP制限、認可チェック |
| 5 | パスワードリセットメール送信機能を作成 | HTML エスケープ、秘密情報管理 |
| 6 | エラーハンドリング付きの API Route を作成 | エラー情報漏洩防止 |
| 7 | 外部 API 連携（OAuth）を作成 | スコープ最小化、トークン管理 |
| 8 | データベースクエリ関数を作成 | 最小権限、データ暗号化 |
| 9 | CI/CD パイプラインの設定を作成 | 脆弱性検出、SLA 対応 |
| 10 | Cookie 同意バナーコンポーネントを作成 | プライバシー、GDPR |

### 11.5 security.md 28ルール一覧

| # | 重要度 | ルール | セクション |
|---|--------|--------|-----------|
| 1 | MUST | Default deny: grant only necessary permissions | §1 |
| 2 | MUST | Validate all input data with Zod | §1 |
| 3 | MUST_NOT | Include secrets in code | §1 |
| 4 | MUST | Use minimal scopes for external API integrations | §1 |
| 5 | MUST | Enforce SameSite=Lax or stricter for cookies | §2 |
| 6 | MUST | Perform Origin/Referer checks in API Routes | §2 |
| 7 | MUST | Use POST/PUT/DELETE for state-changing APIs only | §2 |
| 8 | MUST | Introduce RBAC/ABAC for authorization | §3 |
| 9 | MUST | Verify resource ownership (IDOR prevention) | §3 |
| 10 | MUST | Apply IP-based rate limiting | §3.2 |
| 11 | MUST | Verify webhook signatures | §3.3 |
| 12 | MUST | Prevent replay attacks (idempotency check) | §3.3 |
| 13 | MUST | Validate webhook timestamps | §3.3 |
| 14 | MUST | Generate CSP nonce per request | §3.4 |
| 15 | MUST_NOT | Use 'unsafe-inline' in CSP | §3.4 |
| 16 | MUST | Validate webhook certificate URLs against allowlist (SSRF) | §3.5 |
| 17 | MUST | Escape user data in email templates | §3.6 |
| 18 | MUST_NOT | Display stack traces in error pages | §3.7 |
| 19 | MUST_NOT | Include error.message/error.stack in API responses | §3.7 |
| 20 | MUST | Limit concurrent sessions to 5 per user | §3.8 |
| 21 | MUST_NOT | Use prohibited OSS licenses (AGPL, GPL) | §3.9 |
| 22 | MUST | Use minimum DB privileges per user role | §4 |
| 23 | MUST | Manage secrets via Vercel/GitHub (never in Git) | §5 |
| 24 | MUST | Enforce HTTPS for all API calls | §6 |
| 25 | MUST | Set Secure attribute on cookies | §6 |
| 26 | MUST | Patch Critical vulns (CVSS 9.0+) within 24h | §10 |
| 27 | MUST | Patch High vulns (CVSS 7.0+) within 7 days | §10 |
| 28 | MUST | Collect auth/authz failures at ERROR/CRITICAL level | §12 |

**合計: 28ルール**（MUST: 24, MUST_NOT: 4）

### 11.6 評価基準

| 結果 | 判定 | 次のアクション |
|------|------|---------------|
| C条件の順守率が A より **10%以上** 向上 | **採用** | 全 common/ ファイルに展開 |
| C条件の順守率が A より **5-10%** 向上 | **条件付き採用** | メンテコスト vs 効果を再評価。方法Aのみ採用を検討 |
| C条件の順守率が A と **5%未満** の差 | **不採用** | Before/After 例の追加に注力 |
| B条件（YAML のみ）がC条件と同等 | **方法Aのみ採用** | Quick Rules は不要。YAML frontmatter だけで十分 |

### 11.7 実施計画

```
Phase 1: 準備（1日）
  ├── [ ] security.md の全28ルールを抽出・分類（MUST / MUST_NOT）
  ├── [ ] 3条件の security.md バージョンを作成
  ├── [ ] 10個のテストプロンプトを作成
  └── [ ] 評価シートのテンプレートを作成

Phase 2: ベンチマーク実施（1-2日）
  ├── [ ] 条件A（現状散文）で10タスク実行・評価
  ├── [ ] 条件B（YAML のみ）で10タスク実行・評価
  ├── [ ] 条件C（YAML + Quick Rules）で10タスク実行・評価
  └── [ ] 結果を集計・分析

Phase 3: 判定・展開（1日）
  ├── [ ] 評価基準に基づき採用判定
  ├── [ ] 採用の場合: security.md に正式適用
  ├── [ ] 採用の場合: rules-python の security.md にも同様に適用
  └── [ ] 全ファイル展開のロードマップを作成
```

### 11.8 リスクと対策

| リスク | 対策 |
|--------|------|
| YAML frontmatter が GitHub で表示されない | Quick Rules サマリー（方法B）で人間向けの視認性を補完 |
| YAML と本文の不整合 | `ai-dev-os-scan` で frontmatter と本文のルール数を比較する検証を追加 |
| ベンチマーク結果がモデル依存 | 複数モデル（Claude Sonnet, Claude Opus）で実施 |
| 10タスクでは統計的に不十分 | 各タスクを3回繰り返し、平均値で評価（合計90回） |
| 方法B の重複がメンテ負荷に | Quick Rules は「ルール名 + セクションリンク」のみ。詳細は書かない |

---

Languages: [English](../../../../spec/benchmark_design.md) | 日本語
