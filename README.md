# study-route

数学・哲学・AWS・CS・化学・会計など複数ドメインの概念を一歩ずつ学べるWebアプリ。FFXのスフィア盤のようなスキルマップで学習進捗を可視化し、基礎から専門領域までカバーします。

**https://kent-tokyo.github.io/study-route/**

## 機能

- **マルチドメイン対応** — 6ドメイン・201ノードの学習コンテンツ（数学64、AWS33、CS25、化学27、哲学25、会計24）
- **2段階スキルマップ** — エリア概要（Level 1）→ 詳細マップ（Level 2）のドリルダウン。React Flowによるインタラクティブなグラフ表示
- **スタートノード表示** — 前提なしのノードにSTARTバッジ表示、初回表示時に自動フォーカス
- **概念学習** — MDX + KaTeX数式 + SVG図解 + ビジュアルガイド画像による学習コンテンツ
- **4択クイズ** — 各ノードの理解度チェック（クイズ → 理解確認の2段階）
- **進捗管理** — localStorageに進捗保存。ノード完了で後続ノードが自動解放
- **コンテンツレベル** — 初心者/標準/上級者の3段階切替
- **多言語対応** — 日本語・英語・中国語（UI + グラフラベル + 学習コンテンツ翻訳）
- **ダークモード** — ライト/ダーク切替、フラッシュ防止付き
- **モバイル対応** — レスポンシブヘッダー（モバイル2段/デスクトップ1段）

## ドメイン構成

| ドメイン | エリア数 | ノード数 | 説明 |
|---------|---------|---------|------|
| 数学 | 8 | 64 | 基礎から大学院数学まで |
| 哲学 | 5 | 25 | 認識論・倫理学・論理学・形而上学・美学 |
| AWS | 8 | 33 | コンピューティングからアプリ統合まで |
| CS | 6 | 25 | 基礎理論・アルゴリズム・システム・AI/ML |
| 化学 | 6 | 27 | 一般化学・有機・無機・物理化学・生化学 |
| 会計 | 6 | 24 | 簿記基礎・財務諸表・原価計算・監査 |

## 技術スタック

- Next.js 16 (App Router, Turbopack, Static Export)
- React 19 + TypeScript 5
- Tailwind CSS 4
- @xyflow/react (React Flow) — グラフ可視化
- KaTeX — 数式レンダリング
- DOMPurify — HTMLサニタイズ
- GitHub Pages — ホスティング

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev
```

http://localhost:3000 でアプリが起動します。

## コンテンツ生成

```bash
# .envにAPIキーを設定
# ANTHROPIC_API_KEY=sk-...
# GOOGLE_API_KEY=AIza...

# 単一ノード生成
npm run generate-content -- --node counting

# 全ノード一括生成
npm run generate-content -- --all

# 多言語翻訳（日本語コンテンツを翻訳）
npm run generate-content -- --node counting --locale en
npm run generate-content -- --node counting --locale zh

# オプション
# --all-levels        全レベル生成
# --with-images       ビジュアルガイド画像も生成（Gemini）
# --images-only       画像のみ再生成
# --quiz-only         クイズのみ追加生成
# --locale <locale>   日本語コンテンツを翻訳（en/zh）
# --force             既存コンテンツを上書き
# --model <model>     LLMモデル指定（デフォルト: claude-sonnet-4-6）
# --image-model <m>   画像モデル指定（デフォルト: gemini-2.5-flash-image）
```

5段階生成パイプライン: MDX → 用語集 → SVG図解 → セルフレビュー + クイズ（並列）

コンテンツは `public/content/{domain}/{nodeId}/{level}/` に保存。多言語版は `content.{locale}.json`。

## ビルド・デプロイ

```bash
# ビルド + デプロイ（一括）
npm run deploy:gh-pages
```

## ライセンス

MIT
