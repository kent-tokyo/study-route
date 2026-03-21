# plactice_math - タスク管理

## Phase 1〜5: MVP〜コンテンツ品質向上（完了・履歴）

Phase 1〜5はVercel + S3構成で開発。詳細は git 初期コミットを参照。

- Phase 1: MVP — 認証、スキルマップ、学習ページ、進捗管理、コンテンツ生成
- Phase 2: UX改善 — 2段階マップ、ビューポート保存、ダークモード
- Phase 3: コンテンツ拡充 — 64ノード、ストリーミング生成、再生成
- Phase 4: インフラ修正 — S3バケット、ナビゲーション、8エリア分割、モデル選択
- Phase 5: 品質向上 — SVGテーマ対応、画像生成、説明レベル設定

## Phase 6: 静的サイト化（完了）

- [x] コンテンツ事前生成パイプライン（scripts/generate-content.ts拡張）
- [x] サーバーサイドコード削除（認証、API routes、middleware、S3依存）
- [x] クライアントサイドデータレイヤー（useProgress, useSettings, useContent hooks）
- [x] UIコンポーネント更新（localStorage進捗、静的コンテンツfetch、レベルトグル）
- [x] Next.js静的エクスポート設定（output: 'export'）
- [x] セキュリティレビュー（ビルド出力スキャン、シークレット漏洩チェック）
- [x] GitHub Pages デプロイ
- [x] リポジトリ再作成（履歴のパスワード漏洩対応）

## Phase 7: コンテンツ品質向上（完了）

- [x] 段階生成パイプライン（1回JSON一括 → 4ステップ分離: MDX→用語集→SVG→レビュー）
- [x] セルフレビューパス（数学的正確性・KaTeX構文・具体例充実度チェック）
- [x] 前提知識注入（prerequisitesの既存コンテンツをプロンプトに注入）
- [x] 難易度別プロンプト深度（難易度1-2: 日常例、3: 正確な定義、4-5: 証明+反例）
- [x] `--model`フラグ追加（`claude-opus-4-6`等のモデル指定対応）
- [x] dotenv導入（`.env`自動読み込み、exportハック不要に）
- [x] contents-table.mdにReviewed列追加
- [x] DALL-Eプロンプト改善（抽象画→具体的図解、数字・ラベルOK、MDX文脈注入）
- [x] 画像生成をDALL-E → Google Geminiに移行（テキスト描画品質向上）
- [x] `--images-only` フラグ追加（既存コンテンツの画像のみ再生成）
- [x] `--image-model` フラグ追加（画像生成モデル切替対応）
- [x] contents-table.mdにIllust.列追加
- [x] SVG図解の自動挿入（プレースホルダーなしでも「具体例」前に自動配置）
- [x] countingノードのstandard生成テスト完了（イラスト付き）
- [x] git filter-repoでtasks/・docs/を全履歴から除去+force push
- [x] セキュリティレビュー実施（高信頼度の脆弱性なし）

## Phase 7.5: 基礎編コンテンツ生成（進行中）

- [x] counting / standard
- [ ] number-systems / standard（既存あり、品質向上のため再生成推奨）
- [ ] integers / standard（同上）
- [ ] real-numbers / standard（同上）
- [ ] complex-numbers / standard（同上）
- [ ] set-theory / standard（同上）
- [ ] logic / standard（同上）
- [ ] functions / standard（同上）
- [ ] proof-methods / standard（同上）
- [ ] combinatorics / standard（未生成）
- [ ] 全10ノードの目視レビュー → contents-table.mdのReviewed列を✓に更新

## Phase 8: 残作業

- [x] basePath設定（ビルド時に `NEXT_PUBLIC_BASE_PATH=/plactice_math` を渡して対応）
- [x] DOMPurify style属性のCSS injection対策（CSSプロパティ許可リストによるフィルタリング）
- [ ] 全ノード×全レベルのコンテンツ事前生成（`npm run generate-all`）

## Phase 9: 機能拡張（完了）

- [x] **コントラスト修正**: `text-zinc-400`の低コントラストを`text-zinc-500`/`dark:text-zinc-400`に改善（TermList, LearnPageClient, ConceptView blockquote）
- [x] **キーワードハイライト**: ConceptViewの`<strong>`要素にblue underline装飾を追加（`prose-strong:text-blue-700 prose-strong:underline prose-strong:decoration-blue-300/60`）
- [x] **用語リストのLaTeX対応**: MathTextコンポーネント作成、TermListで`$...$`記法の数式をKaTeXレンダリング。KaTeX CSSをlayout.tsxに移動
- [x] **エッジ重なり修正**: SphereEdgeに動的offset追加（縦方向50px/横方向30px）でノードからエッジを離す
- [x] **4択クイズシステム**: QuizQuestion/QuizChoice型定義、stepGenerateQuiz追加（レビューと並列実行）、QuizViewコンポーネント、ComprehensionCheckにクイズ統合
- [x] **`--quiz-only`フラグ**: 既存コンテンツにクイズのみ追加生成。contents-table.mdにQuiz列追加
- [x] **マルチドメイン対応**: math/philosophy/aws 3ドメイン。`src/data/graph/{domain}/`にデータ分割、`/[domain]/map`・`/[domain]/learn/[nodeId]`ルート、ドメイン選択ランディングページ、ドメイン別進捗保存
- [x] **多言語対応 (i18n)**: ja/en/zh 3言語。`src/i18n/`にContext+hook+翻訳JSON、LocaleProviderでラップ、全UIコンポーネントの文字列を`t()`呼び出しに置換、LanguageSelectorコンポーネント

## Phase 9.5: ラベル多言語化・AWS AI追加・コンテンツ生成（完了）

- [x] **グラフラベルの多言語化**: 全ドメインのareas.json・topics.jsonに`labels`/`descriptions`（ja/en/zh）を追加。`localize()`ユーティリティでランタイム切替
- [x] **SphereGrid多言語対応**: AreaNode・SphereNodeに渡すlabel/descriptionをlocale依存でlocalize
- [x] **ドメイン選択ページ多言語対応**: domains.jsonにlabels/descriptions追加、ランディングページ・マップヘッダーで`localize()`使用
- [x] **AWS AI・機械学習エリア追加**: `ai_ml`エリア新設、SageMaker・Bedrock・Rekognition の3ノード追加
- [x] **contents-table.md 3ドメイン分割**: `updateContentsTable`をドメインごとにセクション分けして出力するよう修正
- [x] **コンテンツ生成**: EC2/standard（クイズ付き）、真理論/standard（クイズ付き）を生成完了
- [x] **数学ドメイン全64ノードのラベル多言語化**: foundations.json, pure-math.json, applied-math.jsonの全ノードに`labels`/`descriptions`を追加
- [x] **学習ページに言語切替ボタン追加**: LearnPageClientヘッダーにLanguageSelector配置、ノードラベル・説明文もlocalize対応
- [x] **`?lang=`クエリパラメータ対応**: URL `?lang=en` > localStorage > デフォルト(ja)の優先順で言語決定。切替時にhistory.replaceStateでURL更新。URLシェアで言語保持
- [x] **「理解した」ボタン後の404修正**: window.location.hrefにbasePath（`/plactice_math`）を付与
- [x] **エッジ重なり改善（動的offset）**: 縦方向接続（dy > dx * 0.8）ではoffsetを50pxに増加
- [x] **image-generator.tsのOpenAI→Gemini移行コミット漏れ修正**
- [x] **counting/standardイラストのgit追加漏れ修正**
- [x] **理解済みセクションに「全体マップに戻る」ボタン追加**: ComprehensionCheckのcompletedステータスに、サブマップ（エリア詳細）と全体マップ（エリア概要）の2つのナビゲーションボタンを配置
- [x] **「マップに戻る」で全体マップに飛ぶ問題修正**: router.push→window.location.href変更（クライアントナビゲーションではuseState初期値が再評価されない）
- [x] **locked科目の文字色改善**: `dark:text-zinc-600`→`dark:text-zinc-500`、`opacity-50`→`opacity-70`
- [x] **哲学ドメイン拡充**: 12→25ノード（様相論理、科学哲学、正義論、自由意志、心身問題、生命倫理、環境倫理、崇高、美的判断など）
- [x] **AWSドメイン拡充**: 15→33ノード、6→8エリア（管理・監視、アプリ統合を新設。Fargate, ELB, API Gateway, WAF, ElastiCache, Redshift, CloudWatch, SQS, SNS, Step Functionsなど）
- [x] **コンピュータサイエンスドメイン追加**: 6エリア28ノード（基礎理論、アルゴリズム、システム、ネットワーク、PL、AI/ML）
- [x] **化学ドメイン追加**: 6エリア27ノード（一般化学、有機、無機、物理化学、分析化学、生化学）
- [x] **会計・簿記ドメイン追加**: 6エリア24ノード（簿記基礎、財務諸表、原価計算、税務会計、管理会計、監査）
- [x] **全201ノードにナンバリング表示**: `number`フィールド（`01-01`形式）をGraphNodeに追加。`add-numbers.ts`スクリプトでエリア順×トポロジカルソートで自動付番。SphereNode・LearnPageClientヘッダーに表示。IDは変更なし
- [x] **各ドメインのルート+次ノードのコンテンツ生成**: 6ドメインから21ノードを一括生成完了（全件成功）
- [x] **ドメイン別プロンプト対応**: content-generator.tsにドメイン検出+ドメイン別プロンプト設定。会計は日本基準ベース+IFRS差異言及、哲学は思考実験重視、AWSはユースケース+ベストプラクティス重視
- [x] **会計コンテンツ再生成**: 日本基準ベース+IFRS差異付きで3ノード再生成
- [x] **MDXテーブル表示対応**: mdxToHtml()にmarkdownテーブルパーサーを追加。proseのテーブルスタイルで罫線付き表示
- [x] **「トップに戻る」ボタン**: 学習ページ右下にフローティング上矢印ボタン。スムーズスクロール対応

## Phase 10: 今後の拡張（未着手）

- [ ] 個人メモ機能（ノードごとにメモを記録）
- [ ] ノード検索・フィルタ機能
- [ ] 学習履歴・統計ダッシュボード
- [ ] モバイル対応（タッチ操作最適化）
- [ ] コンテンツのオフライン対応（Service Worker）
- [ ] カスタムドメインの導入
- [ ] 全ドメインのコンテンツ事前生成
- [ ] コンテンツ生成のlocale対応（`--locale`フラグで英語・中国語コンテンツ生成）
- [ ] コンテンツパスのドメインプレフィックス移行（`public/content/{domain}/{nodeId}/...`）

## デプロイ情報
- GitHub: kent-tokyo/plactice_math（public）
- ホスティング: GitHub Pages
- URL: https://kent-tokyo.github.io/plactice_math/
