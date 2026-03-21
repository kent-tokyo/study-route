# plactice_math - 振り返り・教訓

## アーキテクチャ判断

### DB → S3 → localStorage への段階的移行
- Vercelデプロイ時にDB接続が問題になり、S3に簡素化。その後、静的サイト化でlocalStorageに移行
- 教訓: 個人ツールは最もシンプルなストレージから始めるべき。サーバーレス構成のDB接続は複雑さに見合わないことが多い

### 静的サイト化の判断
- Vercel + S3 + API routes → Next.js Static Export + GitHub Pages に移行
- 認証・API・S3依存を全削除し、コンテンツは事前生成、進捗はlocalStorage
- 教訓: パブリック公開の個人学習アプリにサーバーサイドは不要。静的サイト + ブラウザストレージで十分

### コンテンツ事前生成パイプライン
- オンデマンド生成（SSEストリーミング）→ 事前生成（CLIスクリプト）に移行
- `--all --all-levels` で全ノード×全レベルを一括生成、manifest.jsonで管理
- 教訓: 生成AIコンテンツは事前生成が運用上シンプル。オンデマンドはUX的に魅力的だがインフラ依存が増す

### エリア分割の柔軟性
- 当初5エリア → 8エリアに分割。型変更 + JSON変更のみで済んだ
- 教訓: エリアをデータ駆動にしておけば分割・統合がコード変更最小で済む

### マルチドメイン対応のアーキテクチャ
- MathNode/MathEdge → GraphNode/GraphEdge に汎化。AreaIdをstring型に変更
- graph関数を`domainId`パラメータで切り替え。各ドメインのデータを`src/data/graph/{domain}/`に配置
- ルーティングを`/[domain]/map`・`/[domain]/learn/[nodeId]`に変更、レガシーURLは`/math/...`にリダイレクト
- 教訓: **型を最初から汎用的にしておけばドメイン拡張時の変更が小さくて済む。ただし過度な事前汎化は避け、実際に必要になった時点で汎化するのがベスト**
- 教訓: **静的エクスポートではすべての動的ルートに`generateStaticParams`が必要。クライアントリダイレクト用のページでもサーバーラッパーで分離する**

### i18n設計の判断
- next-intl等のライブラリを使わず、React Context + JSON翻訳ファイルの軽量実装を選択
- 静的エクスポートではURL-basedのロケールルーティングが複雑になるため、localStorage + クライアントサイド切替を採用
- 教訓: **静的エクスポート+個人アプリではi18nライブラリのオーバーヘッドが見合わない。Context+JSONで十分**

### UI文字列 vs データラベルの多言語化は別レイヤー
- UI文字列（ボタン、ヘッダー等）はi18n JSONで`t('key')`で解決
- グラフのノード/エリアラベルはデータ側に`labels: { ja, en, zh }`を持たせ、`localize(locale, default, labels)`で解決
- 2つは別レイヤーだが、ユーザーには一体に見えるため両方を同時に対応しないと中途半端になる
- 教訓: **i18nはUI文字列だけでは不十分。データ駆動のラベルも同時にlocale対応しないと言語切替が壊れて見える**

### ?lang=クエリパラメータによる言語共有
- localStorageだけだとURLシェア時に言語が保持されない
- `?lang=en` クエリパラメータを導入し、URL > localStorage > デフォルトの優先順で言語決定
- 切替時は`history.replaceState`でURLを更新（リロードなし）
- パスプレフィックス方式（`/en/math/map`）は静的エクスポートでビルド3倍になるため不採用
- 教訓: **静的サイトでの言語共有はクエリパラメータが最もコスパが良い。パスプレフィックスはSSRがないと辛い**

### window.location.hrefとbasePath
- GitHub Pagesでは`/plactice_math`がbasePathだが、`window.location.href = '/math/map'`ではbasePathが付かず404になる
- Next.jsの`<Link>`や`router.push`は自動でbasePath付与するが、`window.location.href`は生のブラウザAPIなので手動付与が必要
- `getContentBasePath()`でプレフィックスを取得して付与することで解決
- 教訓: **Next.jsのbasePath付与は`<Link>`/`router`のみ。`window.location.href`やfetchでは手動でbasePathを付ける必要がある**

### エッジ重なりの動的offset
- 固定offset（30px）では縦方向に並んだノード間のエッジがノードの四角形を横切る
- `dy > dx * 0.8`（主に縦方向の接続）ではoffsetを50pxに増加することで改善
- 教訓: **グラフのエッジ描画はノード配置のパターンに応じて動的に調整が必要。一律の固定値では不十分**

### gitへのバイナリ・設定ファイル追加漏れ
- illustration.webpやimage-generator.tsの変更がuntrackedのままデプロイから漏れていた
- 教訓: **デプロイ後は実際のページで動作確認し、アセット漏れがないかチェックする**

### contents-table.mdのスクリプト上書き問題
- contents-table.mdを手動で3ドメイン分割に整理した後、`generate-content.ts`実行でmathのみの旧フォーマットに上書きされた
- `updateContentsTable`をドメイン横断で出力するよう修正して解決
- 教訓: **手動整理したファイルをスクリプトが上書きする場合、スクリプト側も同時に更新する必要がある**

### 「戻る」ボタンの粒度
- 「マップに戻る」だけでは全体マップとサブマップ（エリア詳細）のどちらに戻るか曖昧
- `mapUrl`（`?area=xxx`付き）はサブマップ、`domainMapUrl`（`?area=`なし）は全体マップの2つを用意
- 教訓: **階層構造のあるUIでは「戻る」の行き先を複数提供すべき。ユーザーは直前のレベルだけでなく上位レベルにも戻りたい場合がある**

### ドメイン追加のスケーラビリティ
- 新ドメイン追加に必要な作業: (1) areas.json + topics.json作成 (2) domains.json追記 (3) DomainId型追加 (4) index.tsにimport+switch追加 (5) graph.tsのfallback配列追加 (6) generate-content.tsのDOMAIN_IDS追加
- 6箇所の変更が必要で、switchベースのデータロードは拡張性がやや低い
- 教訓: **ドメインが増えるたびにswitch文を更新するのは保守コストが高い。動的import化やディレクトリスキャンを検討すべきタイミングが来ている**

## フロントエンド

### router.push vs window.location.href（2回目の教訓）
- 「マップに戻る」ボタンで`router.push`を使うと`?area=xxx`のクエリパラメータが効かず全体マップに飛ぶ
- 原因: クライアントサイドナビゲーションではページコンポーネントが再マウントされず、`useState`の初期値（`getInitialArea`）が再評価されない
- `window.location.href`でフルリロードすることで解決（同じパターンの2回目）
- 教訓: **Next.jsの`router.push`はSPAナビゲーション。URLクエリに依存する初期状態はフルリロードでないと反映されない。このパターンは一貫して`window.location.href`を使うべき**

### router.push vs window.location.href
- 「理解した」ボタン後にrouter.pushでマップに戻ると、進捗データが古いまま表示される
- window.location.hrefでフルリロードすることで解決
- 教訓: 重要な状態変更後のナビゲーションはフルリロードが確実

### useSearchParams と SSR/プリレンダリング
- `useSearchParams` を使うとNext.js 16のビルド時にプリレンダリングエラーが発生
- `typeof window !== 'undefined'` ガード付きの `new URLSearchParams(window.location.search)` に変更
- 教訓: Next.jsのクライアントコンポーネントでもプリレンダリングは走る。ブラウザAPI依存は要ガード

### ダークモードのフラッシュ防止
- `layout.tsx`にインラインスクリプトを配置し、Reactハイドレーション前にクラスを適用
- 教訓: テーマ切替はSSR/ハイドレーションのタイミングを意識する必要がある

### React Flowのビューポート保存
- `onMoveEnd`でlocalStorageに保存、`defaultViewport`で復元
- 教訓: マップUIはユーザーの位置記憶が重要。毎回リセットはストレス

### 学習ページからの戻り先
- `?area=xxx` クエリパラメータで直接エリア詳細に遷移するよう改善
- 教訓: 「戻る」操作は元の文脈に戻るべき。全体マップに戻るのは文脈を失う

### generateStaticParams と 'use client' の分離
- 動的ルート（`[nodeId]`）+ static exportには `generateStaticParams` が必須
- `'use client'` ページでは使えないため、サーバーラッパー + クライアントコンポーネントに分離
- 教訓: 静的エクスポートの動的ルートはサーバー/クライアント分離が必要

### redirect() は static export 非対応
- Next.jsの `redirect()` はサーバー関数のため static export で使えない
- `'use client'` + `useRouter().replace()` に変更
- 教訓: static export では Next.js のサーバー専用関数（redirect, cookies, headers等）は一切使えない

### KaTeX CSSの配置
- 複数コンポーネント（ConceptView, MathText/TermList）がKaTeXを使うようになり、個別に`<link>`を置くと重複ロードの懸念
- `layout.tsx`の`<head>`に1箇所だけ配置することで解決
- 教訓: **グローバルなCSSは早めにlayoutに集約する。コンポーネント内での`<link>`は重複リスクがある**

### 共通MathTextコンポーネントのパターン
- ConceptViewのKaTeX処理ロジック（$...$→KaTeX、DOMPurifyサニタイズ、DOM挿入）を汎用化して`MathText`に抽出
- `useRef` + `useEffect` + `DOMParser` パターンでHTML安全挿入
- 教訓: **同じレンダリングパターンを2箇所以上で使うなら共通コンポーネント化する価値がある**

### i18nの変数名衝突に注意
- `useLocale()`の`t`関数とmap内の変数名が衝突しやすい（例: `terms.map((t) => ...)`）
- 変数名を`term`に変更して回避
- 教訓: **翻訳関数名`t`は短くて便利だが、短い変数名と衝突しやすい。map等のコールバック引数名に注意**

## コンテンツ生成

### プロンプト設計
- 構造化されたJSON出力を要求（concept_mdx, terms, diagram_svg）
- 「計算問題は出さない」と明示しないと練習問題を含めてくる
- 教訓: AIに出力形式を厳密に指示し、不要な要素は明示的に除外する

### 品質向上のプロンプト指示
- 分量指示（各セクション3〜5段落）がないと薄い内容になりがち
- 教訓: 品質はプロンプトの具体性に比例する。曖昧な指示は曖昧な出力を生む

### 1回のJSON一括生成 → 段階生成への移行
- 1回のプロンプトでMDX・用語集・SVGをすべてJSON出力させると、JSONパースエラーが頻発（制御文字、巨大JSON）
- 各ステップを分離（MDX → 用語集 → SVG → レビュー）することで、各タスクがシンプルになり品質・安定性が向上
- セルフレビューパスを追加することで数学的正確性・KaTeX構文の誤りを自己修正可能に
- 教訓: **LLMに複雑なマルチタスクを1回で要求するより、単一タスクを段階的に実行する方が品質もパース安定性も高い**

### レビューステップでの出力漏れ
- レビューステップに用語集JSONを参考として渡すと、修正版MDXに用語集を付加して返してくるケースがある
- プロンプトで「MDXのみ返して、用語集は含めないで」と明示し、後処理で末尾JSONを除去するガードも追加
- 教訓: **レビュー用に渡した参考データが出力に混入するリスクがある。プロンプト指示と後処理の二重ガードが必要**

### 前提知識の注入
- prerequisitesノードの既存コンテンツをプロンプトに注入することで、「つながり」セクションの質が向上
- 注入量は先頭500文字程度に制限（トークン節約）
- 教訓: **コンテキストとして関連コンテンツを渡すと、生成される内容の一貫性と関連性が大幅に向上する**

### dotenvの導入
- `.env`ファイルが自動読み込みされず、`export $(grep ...)`ハックが必要だった
- `import 'dotenv/config'` をスクリプト冒頭に追加して解決
- 教訓: **Node.jsスクリプトでは`dotenv`を明示的にimportする必要がある**

### DALL-Eイラストのプロンプト設計
- 初期プロンプト:「テキスト・数字・数式なし」→ 意味不明な抽象画しか生成されない
- 数学概念の図解にテキストも数字もなければ何を伝えたいか不明
- 改善: 数字・ラベル・簡単な数式をOKにし、「具体的なシーン（リンゴに1,2,3と番号を振る等）」を描かせる
- さらに生成済みMDXの冒頭500文字をプロンプトに注入し、概念に即した図解を生成
- スタイルも「インフォグラフィック」→「ホワイトボード風の教育的図解」に変更
- 教訓: **DALL-Eに「○○禁止」と制約を増やすより、「具体的に何を描いてほしいか」を伝える方が有効。特に教育コンテンツでは数字・ラベルを許可しないと意味のある図解にならない**

### DALL-E → Google Gemini への移行
- DALL-Eで生成した教育用イラストは文字が読めず理解しづらかった
- Gemini（`gemini-2.5-flash-image`）はテキスト描画が優れており、日本語ラベル付きの教育的図解を正確に生成できた
- `@google/genai` SDKを使用。レスポンスからbase64画像を直接取得しBufferとして保存（URL経由のfetchが不要に）
- 無料枠ではAPIクォータが`limit: 0`で画像生成不可。課金有効化が必要
- モデル名の注意: `gemini-2.5-flash-preview-image-generation`は404。正しくは`gemini-2.5-flash-image`。ListModels APIで確認すべき
- 教訓: **画像生成モデルの選択はテキスト描画品質で判断すべき。教育コンテンツでは文字の可読性が最重要。モデル名はAPIのListModelsで確認する**

### SVG図解の表示（プレースホルダー問題）
- ConceptViewは`<Diagram src="..." />`プレースホルダーをSVGに置換する設計だが、段階生成ではMDXにプレースホルダーが含まれない
- プレースホルダーがない場合は「具体例」セクションの前に自動挿入するフォールバックを追加
- 教訓: **生成パイプラインを変更したら、フロントエンドの表示ロジックも連動して確認する**

### モデルIDの注意
- `claude-sonnet-4-6-20250610` → 存在しない → `claude-sonnet-4-6`（日付なし）が正解
- 教訓: **モデルIDは日付なしのエイリアスを使う**

### SVGのテーマ対応
- `currentColor` + 親要素の `text-zinc-800 dark:text-zinc-200` で両テーマ対応
- DOMPurifyでサニタイズする際、SVG関連属性を明示的にADD_ATTRする必要がある
- 教訓: SVG生成は色指定・サニタイズの両面で注意が必要

### DOMPurifyのstyle属性許可とCSS injection対策
- KaTeX出力がinline styleを多用するため、DOMPurifyの`ADD_ATTR`に`style`を含める必要がある
- しかし`style`属性を無制限に許可すると、`background-image: url(...)` 等によるデータ窃取やUI偽装のリスクがある
- `afterSanitizeAttributes`フックでCSSプロパティを許可リスト（レイアウト・フォント系のみ）でフィルタリングすることで対策
- フックは`sanitize()`呼び出し後に`removeHook`で解除し、他の利用箇所に影響しないようにする
- 教訓: **DOMPurifyで属性を許可する際は、属性値レベルの検証も必要。特にstyle属性は許可リスト方式でCSSプロパティを制限すべき**

### クイズ生成の並列化
- クイズ生成（stepGenerateQuiz）はレビュー（stepReview）と独立しているため、Promise.allで並列実行可能
- 教訓: **LLMパイプラインのステップ間に依存がなければ並列化でレイテンシを半減できる**

### --quiz-onlyモードの設計
- `--images-only`と同じパターンで既存content.jsonを読み込み→quizフィールドを追加→上書き保存
- 教訓: **「既存データに1フィールド追加」パターンは頻出する。load→merge→saveのパターンを統一しておくとフラグ追加が楽**

## セキュリティ

### リポジトリpublic化時のシークレット漏洩
- テストファイルにパスワードがハードコードされていた
- git履歴に残るため、リポジトリを削除→再作成（orphanブランチで履歴リセット）
- 教訓: **リポジトリをpublicにする前に全履歴のシークレットスキャンが必須**。テストファイルのハードコード値も漏洩リスク

### 静的サイトのセキュリティ確認手順
- `grep -r "ANTHROPIC\|OPENAI\|AWS_SECRET\|PASSWORD" out/` でビルド出力をスキャン
- クライアントコードに `process.env` 参照がないことを確認
- 教訓: 静的エクスポート後のビルド出力を必ずスキャンする

## インフラ・運用

### GitHub Pages のサブパス問題
- `kent-tokyo.github.io/plactice_math/` でホスティングされるため、アセットのパスが `/plactice_math/` 配下になる
- `next.config.ts` の `basePath` は `process.env.NEXT_PUBLIC_BASE_PATH` から取得する設計
- ビルド時に `NEXT_PUBLIC_BASE_PATH=/plactice_math npm run build` で指定が必要（`.env`に書いても可）
- `.env`に書かずビルドコマンドで渡し忘れると `/_next/...` からアセットを読み込もうとして404になる
- 教訓: **GitHub Pagesデプロイ時はbasePath指定を忘れずに。ビルドコマンドに環境変数を含めるか、.envに明記する**

### gh-pages デプロイ
- `npx gh-pages -d out` で `gh-pages` ブランチにデプロイ
- GitHub Pages の Source を `gh-pages` ブランチに設定する必要がある
- privateリポジトリではGitHub Freeプランで Pages を使えない
- 教訓: GitHub Pages を使う場合はリポジトリをpublicにする必要がある（Freeプラン）
