# plactice_math - 開発で得た知見

## アーキテクチャ判断

### DB → S3 への移行
- 当初はlibsql/Drizzle ORMでDB管理を計画していたが、S3のJSON保存に切り替え
- 個人用アプリでCRUDが単純なため、DBのオーバーヘッドが不要だった
- S3なら進捗データを単一JSONファイルで管理でき、シンプル

### 認証方式
- bcryptではなくWeb Crypto API（SHA-256 + HMAC-SHA256）を採用
- Next.js Edge Runtime互換性のため（bcryptはNode.js専用）
- 個人用アプリなので簡易パスワード認証で十分

## Next.js 16 の注意点
- `middleware.ts` は非推奨 → `proxy` への移行が推奨されている
- Turbopack がデフォルトビルドツール
- App Router + Server Components が前提

## Tailwind CSS v4 の注意点
- `tailwind.config.ts` は不要、CSS内で設定する
- ダークモードclass方式: `@variant dark (&:where(.dark, .dark *));` をglobals.cssに記述
- `@plugin` でプラグイン読み込み（例: `@plugin "@tailwindcss/typography"`）
- `@theme inline` でカスタムテーマ変数を定義

## コンテンツ生成
- Claude API（Sonnet 4.6）でMDX + 用語集 + SVG図解を一括生成
- KaTeX記法（`$...$`, `$$...$$`）をMDX内で使用
- SVGはダークテーマ対応（テキスト色 #e4e4e7）
  - ライトモード対応は今後の課題（currentColor化等）

### オンデマンド生成の設計判断
- Vercel無料プラン（タイムアウト10秒）の制約があるため、高速なclaude-sonnet-4-6を選択
- コンテンツ保存先をS3にしたのは、Vercelのファイルシステムが揮発するため
- 読み込みの優先順位（ローカルfs → S3 → 生成）は、手動で品質チェック済みのコンテンツを優先するため
- diagramsはローカルfsでは個別SVGファイルだが、S3では`diagrams.json`に配列として一括保存（S3リクエスト数削減）
- `generateContent()`の戻り値を`void`から`GeneratedContent`に変更し、API側で即レスポンスに使えるようにした
- CLIスクリプトは`saveToLocal: true`オプションで従来通りローカルfs保存を維持

## Vercel デプロイ
- `@aws-sdk/client-s3` はVercel Serverless Functionsで動作する
- 環境変数はVercelダッシュボードで設定が必要
- ビルド時にTurbopackでCSS処理（PostCSS）が走る

## フロントエンド

### React Flow（@xyflow/react v12）
- カスタムノード（SphereNode）で状態別スタイリング
- `key` propでReact Flowコンポーネントを再マウントすると、レベル切替時にクリーンなリセットが可能
- `fitView` と `defaultViewport` は排他的に使う（保存済みviewportがあればfitViewを無効に）
- `onMoveEnd` でビューポートのパン/ズーム状態を取得できる

### DOMPurify + KaTeX
- DOMPurifyでサニタイズする際、KaTeX用のMathML要素を許可リストに追加が必要
- SVG要素も許可リストに追加（`USE_PROFILES: { svg: true }`）

### テーマ切替（ダーク/ライト）
- `<html>` に `dark` クラスを付与する方式
- ページ読み込み時のフラッシュ防止には `<head>` 内のインラインスクリプトが必要
  - React hydration前に実行されるため、`suppressHydrationWarning` を `<html>` に付与
- localStorage → system preference → dark のフォールバック順

### Next.js クライアントナビゲーション
- `router.push()` + `router.refresh()` を連続呼びすると競合する場合がある
- 外部データ（S3）更新後の遷移は `window.location.href` でフルページ遷移が確実
  - クライアントサイドキャッシュを回避し、最新データを確実に取得できる
