# study-route - 要件定義

## プロジェクト概要
数学・哲学・AWSなど複数ドメインの概念を一歩ずつ学べるWebアプリ。FFXのスフィア盤のようなスキルマップで進捗を可視化し、基礎から専門領域までカバーする。静的サイトとしてGitHub Pagesでホスティング。多言語対応（日本語・英語・中国語）。

## 機能要件

### 1. ドメイン選択ページ（/）
- カードグリッドで学習ドメインを表示（数学・哲学・AWS）
- 各カードにドメインカラー、ラベル、説明文
- クリックで `/{domain}/map` に遷移
- テーマ切替ボタン、言語切替ボタン付き

### 2. スキルマップ（/{domain}/map）
- React Flow（@xyflow/react）によるインタラクティブなグラフ表示
- **2段階マップ構造**
  - Level 1（エリア概要）: エリアを大きなノードで表示、エリア間の依存関係を矢印で表示、各エリアの進捗バー付き
  - Level 2（詳細）: エリア内のノード一覧、クリックで学習ページへ遷移、「← 全体マップ」で戻る
- **ドメイン別エリア構成**:
  - 数学: 8エリア（foundations, pure_algebra, pure_analysis, pure_geometry, stochastic, computational, mathematical_modeling, social）
  - 哲学: 5エリア（epistemology, ethics, logic, metaphysics, aesthetics）
  - AWS: 8エリア（compute, storage, networking, security, databases, ai_ml, management, app_integration）
- **詳細マップへの直接遷移**: `?area=xxx` クエリパラメータで初期表示エリアを指定可能
- ノード間の前提関係（prerequisites）を矢印で表示
- ノード状態: locked / available / in_progress / completed
- 分野別カラーコード（ドメインごとに定義）
- 難易度表示（★1〜5）
- **ノードナンバリング**: `DD-NNN`形式（ドメインプレフィックス+ドメイン内通し番号、例: `04-001`）のナンバーをノードカード内に薄い色で表示。contents-table.mdと同一フォーマット。`number`フィールド（GraphNode）で管理、`add-numbers.ts`スクリプトで自動付番（エリア順×トポロジカルソート）
- 完了数カウンター（エリアレベル/全体レベルで切替）
- **ビューポート保存**: パン/ズーム状態をlocalStorageに保存し、再訪時に復元（ドメイン+エリアごとにキー分離）
- **エッジ重なり防止**: `getSmoothStepPath` に動的offset（縦方向接続80px / 横方向50px、borderRadius 20px）でノードからエッジを離す
- **モバイル対応ヘッダー**: `flex flex-col md:flex-row` で2段レイアウト。上段: ナビ+タイトル、下段: 完了数・レベル切替・言語・テーマ。padding `px-4 py-2 md:px-6 md:py-3`
- **マップ領域**: 外側 `h-screen flex flex-col`、マップ領域 `flex-1 overflow-hidden`（ヘッダー高さに依存しない）
- **スタートノード表示**: 詳細マップ: `prerequisites.length === 0` のノードに `START` バッジ + `ring-2 ring-blue-400/50`。全体マップ: `areaEdges`のターゲットに含まれないエリア（入力エッジなし）に `START` バッジ + `ring-2 ring-blue-400/50`。両レベルとも初回表示時にスタートノード/エリアにフォーカス（padding: 0.5, maxZoom: 1.0）。**STARTエリアは最も左（低x座標）に配置**し、非STARTエリアを右側に配置することで視覚的にエントリーポイントを明示
- ヘッダー: ドメイン選択へ戻るリンク、コンテンツレベルトグル、言語切替、テーマ切替

### 3. 概念学習ページ（/{domain}/learn/[nodeId]）
- 事前生成された静的コンテンツ（content.json）をfetchして表示
- MDXコンテンツ表示（KaTeX数式レンダリング対応）
- **キーワードハイライト**: `<strong>` 要素にblue underline装飾（`prose-strong:text-blue-700 prose-strong:underline`）
- **改善されたコントラスト**: blockquoteを`text-zinc-600`に、メタデータを`text-zinc-500`に改善
- 用語集（TermList）表示 — **用語・定義のLaTeX数式レンダリング対応**（MathTextコンポーネント使用）
- SVG図解の埋め込み（ダーク/ライト両テーマ対応）
- Gemini生成のビジュアルガイド画像表示（スライド風カード）
- コンテンツレベル切替（利用可能なレベルのみ表示）
- **4択クイズ**（QuizView）→ 理解度チェック → 「理解した」ボタンの順で表示
- 理解済み時: 「マップに戻る」（サブマップ=エリア詳細）+「全体マップ」（エリア概要）の2ボタン表示
- 「学習中にする」ボタンによる進捗更新
- **MDXテーブル表示**: markdownテーブル記法をHTMLの`<table>`に変換（proseスタイル適用）
- **「トップに戻る」ボタン**: 右下にフローティング上矢印ボタン（スムーズスクロール）
- **テーマ切替**: ヘッダー右端に太陽/月アイコンボタン
- **パンくずナビ**: `ドメイン名 / エリア名` 形式でドメイン→全体マップ、エリア→サブマップに遷移
- **モバイル対応ヘッダー**: `flex-wrap` + `gap-y-1` でラップ、説明文（★ + description）は `hidden md:inline` でモバイル非表示
- **数式ブロック表示**: `$$...$$` ブロックをプレースホルダーに退避してから `<p>` ラップし、復元時に `<p>` タグを除去（`</p><p>` 混入防止）
- DOMPurifyによるHTMLサニタイズ

### 3.5. サイトポリシーページ（/policy）
- 免責事項（AI生成コンテンツ、会計基準の注意）、プライバシー（localStorageのみ）、使用技術、ライセンス、お問い合わせ
- 多言語対応（ja/en/zh）、言語セレクター・テーマ切替付き

### 3.6. フッター
- `© {year} study-route | Site Policy | GitHub` を表示
- ドメイン選択・学習ページ・ポリシーページに配置（マップページには非表示）

### 4. 4択クイズシステム
- **QuizQuestion型**: question, choices (4択), explanation
- **QuizViewコンポーネント**: 問題表示 → 選択 → 正解/不正解ハイライト → 解説表示 → 次の問題 → スコア表示
- クイズ完了後に「理解度チェック」（ComprehensionCheck）に遷移
- 数式はMathTextコンポーネントでKaTeXレンダリング

### 5. 進捗管理
- **localStorage**に進捗データをJSON保存（`study-route_progress_{domain}`）
- ドメインごとに独立した進捗データ
- ノード完了時に後続ノードの自動解放（全前提クリアで available に）
- useProgress hookで取得・更新（domain引数対応）

### 6. コンテンツ保存
- `public/content/{nodeId}/{level}/content.json` — 事前生成コンテンツ（レガシー: mathドメイン）
- `public/content/{domain}/{nodeId}/{level}/content.json` — ドメインプレフィックス付き（将来対応）
- `public/content/{nodeId}/{level}/illustration.webp` — Gemini生成画像
- `public/content/manifest.json` — 生成済みコンテンツのインデックス
- content.jsonの形式:
  ```json
  {
    "id": "UUID",
    "nodeId": "counting",
    "level": "standard",
    "generatedAt": "2026-03-20T...",
    "content": "MDX文字列",
    "terms": [{ "term": "...", "reading": "...", "en": "...", "definition": "..." }],
    "diagrams": [{ "name": "...", "svg": "..." }],
    "quiz": [{ "question": "...", "choices": [{ "text": "...", "isCorrect": true/false }], "explanation": "..." }]
  }
  ```

### 7. コンテンツ生成（スクリプト）
- Claude AIによるコンテンツ事前生成
- 生成物: content.json（MDX、用語集、SVG図解、クイズ）、illustration.webp
- デプロイ: `npm run deploy:gh-pages`（ビルド+デプロイ一括実行、`NEXT_PUBLIC_BASE_PATH=/study-route`自動付与）
- CLIスクリプト: `npm run generate-content -- --node <nodeId>`
  - `--all` 全ノード / `--all-levels` 全レベル / `--with-images` 画像生成
  - `--force` 上書き / `--dry-run` 確認のみ
  - `--model <model>` LLMモデル指定（デフォルト: `claude-sonnet-4-6`）
  - `--image-model <model>` 画像生成モデル指定（デフォルト: `gemini-2.5-flash-image`）
  - `--images-only` 既存コンテンツの画像のみ再生成（コンテンツ生成をスキップ）
  - `--quiz-only` 既存コンテンツにクイズのみ追加生成
  - 並列実行制御（3並列）、既存スキップ（resume機能）
  - 実行後に manifest.json と contents-table.md を自動更新
  - `dotenv/config`による`.env`自動読み込み（`export`ハック不要）
- **5段階生成パイプライン**:
  1. Step 1 — MDX生成: 概念説明をプレーンMDXで生成（JSON制約なし、品質向上）
  2. Step 2 — 用語集生成: MDXを入力に用語集JSONを生成
  3. Step 3 — SVG図解生成: MDXを入力にSVG文字列を生成
  4. Step 4 — セルフレビュー: 数学的正確性・KaTeX構文・具体例充実度チェック（Step 5と並列実行）
  5. Step 5 — クイズ生成: MDXを入力に4択クイズJSON配列を生成（Step 4と並列実行）
- **ドメイン別プロンプト**: `getDomainPromptConfig()`でドメインごとにロール・セクション構成・追加指示をカスタマイズ
  - 数学: 数学教育の専門家、定義・定理→具体例→応用
  - 哲学: 哲学教育の専門家、主要な議論・立場→思考実験→現代への影響
  - AWS: AWSクラウドアーキテクト、仕組み・機能→ユースケース→ベストプラクティス
  - 会計: 公認会計士レベル、日本基準(J-GAAP)ベース+IFRS差異言及（advancedでは詳細比較+US-GAAP）
  - CS/化学: 各分野の教育専門家、標準構成
- **前提知識注入**: prerequisitesノードの既存コンテンツ（先頭500文字）をプロンプトに注入し、「つながり」セクションの質を向上
- **難易度別プロンプト深度**:
  - 難易度1-2: 具体例3つ以上（うち1つは日常生活の例）、クイズ3問
  - 難易度3: 具体例3つ以上、定義を正確に記述、クイズ4問
  - 難易度4-5: 証明のスケッチ必須、定理の仮定が外れた反例を1つ示す、クイズ5問
- **説明レベル制御**: contentLevelパラメータでプロンプトを動的に変更
  - 初心者向け: やさしい言葉・数式最小限・各セクション1〜2段落
  - 標準: バランス重視・各セクション2〜3段落・具体例2つ以上
  - 上級者向け: 厳密な定義・証明・各セクション3〜5段落
- **contents-table.md**: Illust.列・Quiz列・Reviewed列を含む生成状況テーブル（目視確認後に手動で`✓`に変更）

### 7.5. 画像生成（Google Gemini）
- Google Gemini の画像生成モデルによる概念のビジュアルガイド画像生成
- デフォルトモデル: `gemini-2.5-flash-image`
- `--image-model <model>` フラグでモデル切替可能（`gemini-3.1-flash-image-preview`, `gemini-3-pro-image-preview` 等）
- スクリプトの `--with-images` フラグで生成、`--images-only` で画像のみ再生成
- 画像スタイル: ホワイトボード風の教育的図解（数字・ラベル・簡単な数式OK）
- 生成済みMDXの冒頭500文字をプロンプトに注入し、概念に即した図解を生成
- Gemini APIからbase64で画像を取得しBufferとして直接保存
- 保存: `public/content/{nodeId}/{level}/illustration.webp`

### 7.7. SVG図解の自動挿入
- SVG図解はcontent.jsonのdiagrams配列に格納
- MDX内に`<Diagram src="..." />`プレースホルダーがあれば置換、なければ「具体例」セクションの前に自動挿入
- DOMPurify（SVGプロファイル）でサニタイズ後に表示

### 7.6. SVGのダーク/ライトモード両対応
- 生成SVGは `fill="currentColor"` / `stroke="currentColor"` を使用（テーマ自動対応）
- 強調色は固定色（#3b82f6 青, #ef4444 赤, #22c55e 緑）
- 旧SVG（`#e4e4e7` ハードコード）はランタイムで `currentColor` に補正

### 8. コンテンツレベル設定
- ヘッダーのトグルで切替（初心者/標準/上級者）
- localStorageに保存（`study-route_content_level`）
- useSettings hookで取得・更新
- マップページと学習ページの両方で切替可能

### 9. ダークモード/ライトモード切替
- Tailwind CSS v4のclass方式（`@variant dark`）
- localStorage `theme` キーで設定保存
- 初期値: localStorage > system preference > dark
- テーマ切替ボタン（太陽/月アイコン）をヘッダーに配置
- ページ読み込み時のフラッシュ防止（インラインスクリプトで即座にクラス適用）

### 10. 多言語対応 (i18n)
- **対応言語**: 日本語 (ja)、英語 (en)、中国語 (zh)
- **翻訳ファイル**: `src/i18n/locales/{ja,en,zh}.json` — UI文字列の翻訳
- **コンテキスト**: `LocaleProvider`（React Context）でアプリ全体をラップ
- **useLocale hook**: `{ locale, setLocale, t }` を返す。`t('key.path')` で翻訳文字列取得
- **言語設定**: `?lang=`クエリパラメータ > localStorage `study-route_locale` > デフォルト(ja)の優先順。切替時はhistory.replaceStateでURL更新（リロードなし）。URLシェアで言語保持
- **言語セレクタ**: コンパクトなトグルボタン（日本語 / EN / 中文）、マップヘッダー・ドメイン選択ページ・学習ページヘッダーに配置
- **翻訳対象**: ナビゲーション、ボタンラベル、ステータス表示、クイズUI、理解度チェック、用語一覧ヘッダー等
- **データラベル多言語化**: graph JSONの各エリア・ノードに`labels`/`descriptions`オブジェクト（`{ ja, en, zh }`）を追加。`localize(locale, default, labels)`ユーティリティ（`src/i18n/localize.ts`）でランタイム解決。SphereGrid内でノード/エリアデータ構築時にlocalize適用
- **データラベル対応範囲**: 全3ドメインのエリア・ノードのlabel/descriptionが多言語化済み（数学64ノード含む）
- **未対応（将来）**: コンテンツ本体のlocale別生成

### 11. マルチドメイン対応
- **ドメイン定義**: `src/data/graph/domains.json`（id, prefix, label, labels, description, descriptions, color, contentsTableLabel, areaOrder）— ドメインプレフィックス・エリア順序・ラベルなどの一元管理マスタ
- **ドメイン型**: `DomainId = 'math' | 'philosophy' | 'aws'`
- **グラフデータ**: `src/data/graph/{domain}/` にドメインごとのエリア・ノード・エッジを配置
- **汎用型**: `GraphNode`（旧MathNode）、`GraphEdge`（旧MathEdge）、`AreaId = string`
- **ルーティング**: `/{domain}/map`、`/{domain}/learn/[nodeId]`。旧URL（`/map`、`/learn/[nodeId]`）は`/math/...`にリダイレクト
- **進捗分離**: ドメインごとに独立したlocalStorageキー
- **ドメイン構成**:

| ドメイン | エリア数 | ノード数 | 説明 |
|---------|---------|---------|------|
| math | 8 | 64 | 基礎から大学院数学まで |
| philosophy | 5 | 25 | 認識論・倫理学・論理学・形而上学・美学 |
| aws | 8 | 33 | コンピューティング・ストレージ・ネットワーキング・セキュリティ・DB・AI/ML・管理監視・アプリ統合 |
| cs | 6 | 25 | 基礎理論・アルゴリズム・システム・ネットワーク・PL・AI/ML |
| chemistry | 6 | 27 | 一般化学・有機・無機・物理化学・分析化学・生化学 |
| accounting | 6 | 24 | 簿記基礎・財務諸表・原価計算・税務会計・管理会計・監査 |

## 非機能要件

### 技術スタック
- Next.js 16 (App Router, Turbopack, Static Export)
- React 19 + TypeScript 5（strict mode）
- Tailwind CSS 4
- GitHub Pages（ホスティング）
- Anthropic Claude API（コンテンツ生成スクリプト用）
- Google Gemini API（画像生成スクリプト用）

### セキュリティ
- 全HTML/SVG出力をDOMPurifyでサニタイズ
- KaTeX出力もサニタイズ対象
- DOMPurifyの`style`属性許可にはCSSプロパティ許可リストによるフィルタリングを適用（CSS injection対策）
- クライアントコードにAPIキー・process.envの参照なし
- ビルド出力にシークレット漏洩なし

### コンテンツ構成

#### 数学ドメイン（64ノード・8エリア）

| エリア | ノード数 | 難易度範囲 | 代表的なノード |
|--------|---------|-----------|---------------|
| 基礎 (foundations) | 16 | 1-4 | counting, set-theory, logic, category-theory |
| 代数学 (pure_algebra) | 13 | 2-5 | linear-algebra, group-theory, galois-theory |
| 解析学 (pure_analysis) | 13 | 3-5 | calculus, real-analysis, functional-analysis |
| 幾何学 (pure_geometry) | 8 | 2-5 | euclidean-geometry, manifolds, algebraic-geometry |
| 確率・統計 (stochastic) | 5 | 3-4 | probability, statistics, stochastic-processes |
| 最適化・計算 (computational) | 4 | 3-4 | optimization, numerical-analysis, machine-learning-math |
| 物理・制御 (mathematical_modeling) | 3 | 4-5 | mathematical-physics, dynamical-systems |
| 社会科学応用 (social) | 2 | 3-4 | game-theory, cryptography |

#### 哲学ドメイン（25ノード・5エリア）

| エリア | ノード数 | 代表的なノード |
|--------|---------|---------------|
| 認識論 (epistemology) | 5 | truth, justification, skepticism, rationalism-empiricism, philosophy-of-science |
| 倫理学 (ethics) | 6 | utilitarianism, deontology, virtue-ethics, justice, bioethics, environmental-ethics |
| 論理学 (logic) | 4 | propositional-logic, predicate-logic, modal-logic, informal-fallacies |
| 形而上学 (metaphysics) | 5 | ontology, causation, free-will, mind-body, time-space |
| 美学 (aesthetics) | 4 | beauty, art-philosophy, sublime, aesthetic-judgment |

#### AWSドメイン（33ノード・8エリア）

| エリア | ノード数 | 代表的なノード |
|--------|---------|---------------|
| コンピューティング (compute) | 5 | ec2, lambda, ecs, fargate, auto-scaling |
| ストレージ (storage) | 4 | s3, ebs, efs, glacier |
| ネットワーキング (networking) | 5 | vpc, route53, cloudfront, elb, api-gateway |
| セキュリティ (security) | 4 | iam, kms, cognito, waf |
| データベース (databases) | 4 | rds, dynamodb, elasticache, redshift |
| AI・機械学習 (ai_ml) | 4 | sagemaker, bedrock, rekognition, comprehend |
| 管理・監視 (management) | 4 | cloudwatch, cloudformation, ssm, cloudtrail |
| アプリ統合 (app_integration) | 4 | sqs, sns, step-functions, eventbridge |

#### コンピュータサイエンスドメイン（25ノード・6エリア）

| エリア | ノード数 | 代表的なノード |
|--------|---------|---------------|
| 基礎理論 (foundations_cs) | 4 | binary-logic, discrete-math, automata, complexity |
| アルゴリズム (algorithms) | 4 | data-structures, sorting-searching, graph-algorithms, dynamic-programming |
| システム (systems) | 5 | os-basics, file-systems, db-fundamentals, distributed-systems, compiler |
| ネットワーク (networking_cs) | 4 | tcp-ip, http-web, network-security, dns-routing |
| プログラミング言語 (pl) | 4 | programming-paradigms, type-systems, fp, concurrent-programming |
| AI・機械学習 (ai_cs) | 4 | ml-basics, deep-learning, nlp, reinforcement-learning |

#### 化学ドメイン（27ノード・6エリア）

| エリア | ノード数 | 代表的なノード |
|--------|---------|---------------|
| 一般化学 (general_chem) | 5 | atomic-structure, chemical-bonding, stoichiometry, states-of-matter, solutions |
| 有機化学 (organic) | 4 | hydrocarbons, functional-groups, organic-reactions, stereochemistry |
| 無機化学 (inorganic) | 3 | coordination-chem, solid-state, bioinorganic |
| 物理化学 (physical) | 5 | thermodynamics-chem, kinetics, equilibrium, electrochemistry, quantum-chem |
| 分析化学 (analytical) | 3 | acid-base, spectroscopy, chromatography |
| 生化学 (biochem) | 4 | amino-acids-proteins, enzymes, metabolism, nucleic-acids |

#### 会計・簿記ドメイン（24ノード・6エリア）

| エリア | ノード数 | 代表的なノード |
|--------|---------|---------------|
| 簿記の基礎 (bookkeeping) | 5 | double-entry, accounts, journal-entries, trial-balance, closing-entries |
| 財務諸表 (financial_statements) | 4 | balance-sheet, income-statement, cash-flow, financial-analysis |
| 原価計算 (cost_accounting) | 4 | cost-classification, job-costing, process-costing, standard-costing |
| 税務会計 (tax_accounting) | 3 | corporate-tax, consumption-tax, deferred-tax |
| 管理会計 (management_accounting) | 4 | cvp-analysis, budgeting, decision-accounting, abc |
| 監査 (auditing) | 3 | internal-control, audit-procedures, audit-report |

## 環境変数（スクリプト用のみ）

| 変数名 | 用途 |
|--------|------|
| ANTHROPIC_API_KEY | Claude APIキー（コンテンツ生成スクリプト用）|
| GOOGLE_API_KEY | Google APIキー（Gemini画像生成スクリプト用）|
