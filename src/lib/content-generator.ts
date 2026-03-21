import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { getNode, getAllNodes } from './graph';
import { getAreaToDomainMap } from '@/data/graph';
import type { Term, QuizQuestion } from '@/types';

export interface GeneratedContent {
  content: string;
  terms: Term[];
  diagrams: { name: string; svg: string }[];
  quiz: QuizQuestion[];
}

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Robust JSON array parser for LLM output
// ---------------------------------------------------------------------------

function parseJsonArray<T>(text: string, fallback: T[]): T[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return fallback;

  // 1st attempt: direct parse
  try {
    return JSON.parse(jsonMatch[0]);
  } catch { /* continue */ }

  // 2nd attempt: fix unescaped control characters and bare backslashes inside JSON string values
  try {
    const raw = jsonMatch[0];
    let fixed = '';
    let inString = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '"' && (i === 0 || raw[i - 1] !== '\\')) {
        inString = !inString;
        fixed += ch;
      } else if (inString && ch === '\n') {
        fixed += '\\n';
      } else if (inString && ch === '\r') {
        // skip
      } else if (inString && ch === '\t') {
        fixed += '\\t';
      } else if (inString && ch === '\\') {
        // Check next char for valid JSON escape sequences
        const next = raw[i + 1];
        if (next && '"\\/bfnrtu'.includes(next)) {
          fixed += ch; // valid escape, keep as-is
        } else {
          fixed += '\\\\'; // bare backslash, escape it
        }
      } else {
        fixed += ch;
      }
    }
    return JSON.parse(fixed);
  } catch { /* continue */ }

  // 3rd attempt: strip markdown code fences and retry
  try {
    const stripped = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const match2 = stripped.match(/\[[\s\S]*\]/);
    if (match2) return JSON.parse(match2[0]);
  } catch { /* continue */ }

  return fallback;
}

// ---------------------------------------------------------------------------
// Domain detection from area
// ---------------------------------------------------------------------------

const AREA_TO_DOMAIN = getAreaToDomainMap();

function getDomainFromArea(area: string): string {
  return AREA_TO_DOMAIN[area] || 'math';
}

// ---------------------------------------------------------------------------
// Domain-specific prompt configuration
// ---------------------------------------------------------------------------

function getDomainPromptConfig(domain: string, level: string): { role: string; subject: string; extra: string; sectionOverrides?: string } {
  switch (domain) {
    case 'philosophy':
      return {
        role: '哲学教育の専門家',
        subject: '哲学',
        extra: '',
        sectionOverrides: `
## なぜ必要か — 哲学における位置づけ
（この概念が哲学のどこで議論され、なぜ重要なのか）

## 核となるアイデア — 主要な議論・立場
（主要な哲学者の見解を引用しつつ、中心的な議論を正確に述べる）

## 具体例・思考実験
（最低3つの具体例や思考実験を挙げる。それぞれ異なる角度から概念を照らすこと）

## つながり — 他の概念との関係
（前提知識や発展先との関係を明示する）

## 現代への応用・影響
（現代社会・科学・倫理・政治などでこの概念がどう活きているか）`,
      };
    case 'aws':
      return {
        role: 'AWSクラウドアーキテクトかつ教育の専門家',
        subject: 'AWSサービス',
        extra: `
- AWSの公式ドキュメントに準拠した正確な説明をすること
- ユースケースと設計パターンを重視すること`,
        sectionOverrides: `
## なぜ必要か — クラウドにおける位置づけ
（このサービスがなぜ存在し、どのような課題を解決するのか）

## 核となるアイデア — 仕組みと主要機能
（アーキテクチャ、主要な設定項目、料金体系の概要）

## 具体例・ユースケース
（最低3つのユースケースを挙げる。それぞれ異なるシナリオで説明）

## つながり — 他のサービスとの関係
（よく組み合わせて使うサービスや、代替サービスとの比較）

## ベストプラクティス
（セキュリティ・コスト最適化・可用性の観点からの推奨事項）`,
      };
    case 'cs':
      return {
        role: 'コンピュータサイエンス教育の専門家',
        subject: 'コンピュータサイエンスの概念',
        extra: '',
      };
    case 'chemistry':
      return {
        role: '化学教育の専門家',
        subject: '化学の概念',
        extra: '',
      };
    case 'accounting':
      return {
        role: '会計・簿記教育の専門家（公認会計士レベル）',
        subject: '会計・簿記の概念',
        extra: level === 'advanced'
          ? `
- 日本基準（J-GAAP）を基本としつつ、IFRS（国際財務報告基準）との主要な差異を詳しく比較すること
- 米国基準（US-GAAP）にも適宜言及すること
- 各基準の背景にある考え方の違いも解説すること`
          : `
- 日本基準（J-GAAP）を基本として説明すること
- IFRS（国際財務報告基準）との主要な差異がある場合は簡潔に触れること
- 日本固有の制度（消費税のインボイス制度等）は明示すること`,
      };
    default: // math
      return {
        role: '数学教育の専門家',
        subject: '数学',
        extra: '',
      };
  }
}

// ---------------------------------------------------------------------------
// Prerequisite content injection
// ---------------------------------------------------------------------------

function loadPrerequisiteContents(nodeId: string): string {
  const node = getNode(nodeId);
  if (!node || node.prerequisites.length === 0) return '';

  const OUTPUT_DIR = path.join(process.cwd(), 'public', 'content');
  const sections: string[] = [];

  for (const prereqId of node.prerequisites) {
    const prereqNode = getNode(prereqId);
    if (!prereqNode) continue;

    // Try to load existing generated content for this prerequisite
    const prereqDomain = AREA_TO_DOMAIN[prereqNode.area] || 'math';
    const contentPath = path.join(OUTPUT_DIR, prereqDomain, prereqId, 'standard', 'content.json');
    if (fs.existsSync(contentPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
        const excerpt = (data.content as string || '').slice(0, 500);
        sections.push(`### ${prereqNode.label}（${prereqId}）\n${excerpt}...`);
      } catch {
        sections.push(`### ${prereqNode.label}（${prereqId}）\n${prereqNode.description}`);
      }
    } else {
      sections.push(`### ${prereqNode.label}（${prereqId}）\n${prereqNode.description}`);
    }
  }

  if (sections.length === 0) return '';
  return `\n\n## 前提知識（この概念を学ぶ前に理解しているべき内容）\n\n${sections.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Difficulty-based prompt depth
// ---------------------------------------------------------------------------

function getDifficultyInstruction(difficulty: number): string {
  if (difficulty <= 2) {
    return `【難易度別指示（難易度${difficulty}/5）】
- 具体例は3つ以上挙げること。うち1つは日常生活の例にすること
- 難しい概念は図やたとえ話で直感的に説明すること
- 読者が「なるほど」と思える具体的なイメージを重視すること`;
  }
  if (difficulty === 3) {
    return `【難易度別指示（難易度3/5）】
- 具体例は3つ以上挙げること
- 定義を正確に記述すること（形式的な記法を含める）
- 直感的な理解と形式的な正確さのバランスを取ること`;
  }
  // difficulty 4-5
  return `【難易度別指示（難易度${difficulty}/5）】
- 具体例は3つ以上挙げること
- 証明のスケッチを必ず含めること
- 定理の仮定が外れた場合の反例を1つ示すこと
- 厳密な定義と定理の記述を含めること`;
}

// ---------------------------------------------------------------------------
// Content level instruction
// ---------------------------------------------------------------------------

function getContentLevelInstruction(level: string): string {
  switch (level) {
    case 'beginner':
      return `【説明レベル: 初心者向け】
- 専門用語は最小限にし、使う場合は必ず噛み砕いて説明する
- 数式は本当に必要なものだけ使い、必ず日本語で意味を補足する
- 身近な例え話やイメージを多用する
- 各セクションは1〜2段落で簡潔にまとめる
- 「なぜこれを学ぶと嬉しいのか」を重視する
- 中学〜高校生でもわかる文章で書く`;
    case 'advanced':
      return `【説明レベル: 上級者向け】
- 厳密な定義・定理・証明のスケッチを含める
- 数式を積極的に使用し、形式的な記述を重視する
- 各セクションは3〜5段落の充実した内容にする
- 歴史的背景や発展の経緯にも触れる
- 関連する未解決問題や発展的トピックにも言及する
- 大学数学の教科書レベルの正確さで書く`;
    default:
      return `【説明レベル: 標準】
- わかりやすさと正確さのバランスを重視する
- 各セクションは2〜3段落で適度な分量にする
- 数式は必要に応じて使い、直感的な説明も添える
- 具体例は2つ以上挙げる
- 大学初年度レベルの読者を想定する`;
  }
}

// ---------------------------------------------------------------------------
// Step 1: Generate concept MDX (plain MDX, no JSON)
// ---------------------------------------------------------------------------

async function stepGenerateMDX(
  nodeLabel: string,
  nodeId: string,
  difficulty: number,
  description: string,
  area: string,
  contentLevel: string,
  prerequisiteContext: string,
  model: string,
): Promise<string> {
  const levelInstruction = getContentLevelInstruction(contentLevel);
  const difficultyInstruction = getDifficultyInstruction(difficulty);
  const domain = getDomainFromArea(area);
  const domainConfig = getDomainPromptConfig(domain, contentLevel);

  const sections = domainConfig.sectionOverrides || `
## なぜ必要か — ${domainConfig.subject}における位置づけ
（この概念が${domainConfig.subject}のどこで使われ、なぜ重要なのか）

## 核となるアイデア — 定義・定理の本質
（数式は $...$ や $$...$$ のKaTeX形式で。中心的な定義や定理を正確に述べる）

## 具体例
（最低3つの具体例を挙げる。それぞれ異なる角度から概念を照らすこと）

## つながり — 他の概念との関係
（前提知識や発展先との関係を明示する）

## 他分野への応用
（他の分野でこの概念がどう使われるか）`;

  const prompt = `あなたは${domainConfig.role}です。以下の${domainConfig.subject}の概念について、MDX形式の概念説明コンテンツを生成してください。

概念: ${nodeLabel}（${nodeId}）
難易度: ${difficulty}/5
概要: ${description}
分野: ${area}

${levelInstruction}

${difficultyInstruction}
${domainConfig.extra}
${prerequisiteContext}

以下の構成でMDXコンテンツを書いてください（JSON不要、MDXそのものを返してください）:

# ${nodeLabel}

## 何か — 直感的な説明
（この概念を一言で説明し、初めて出会う読者が「ああ、こういうことか」と思える導入）
${sections}

注意:
- 計算問題は出さない（概念理解に特化）
- 数式はKaTeX形式（$inline$, $$display$$）
- MDXのみを返してください（他の説明テキストやコードブロック囲みは不要）`;

  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  // Strip potential markdown code fences
  return text.replace(/^```(?:mdx|markdown)?\n?/, '').replace(/\n?```$/, '').trim();
}

// ---------------------------------------------------------------------------
// Step 2: Generate terms from MDX
// ---------------------------------------------------------------------------

async function stepGenerateTerms(
  mdxContent: string,
  nodeLabel: string,
  model: string,
): Promise<Term[]> {
  const prompt = `以下は「${nodeLabel}」に関する数学の学習コンテンツです。このコンテンツに登場する重要な専門用語の用語集をJSON配列で生成してください。

---
${mdxContent}
---

以下の形式のJSON配列のみを返してください（他のテキストは不要）:

[
  { "term": "用語名", "reading": "よみがな", "en": "English Term", "definition": "簡潔な定義（1〜2文）" }
]

注意:
- コンテンツに実際に登場するか密接に関連する用語のみ（5〜15個程度）
- reading はひらがなで
- definition は簡潔かつ正確に`;

  const response = await client.messages.create({
    model,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonArray(text, []);
}

// ---------------------------------------------------------------------------
// Step 3: Generate SVG diagram from MDX
// ---------------------------------------------------------------------------

async function stepGenerateSVG(
  mdxContent: string,
  nodeLabel: string,
  model: string,
): Promise<string | null> {
  const prompt = `以下は「${nodeLabel}」に関する数学の学習コンテンツです。このコンテンツの核となる構造・関係性を視覚化するSVG図を1つ生成してください。

---
${mdxContent.slice(0, 3000)}
---

SVG図の条件:
- 概念マップ、フロー図、ベン図、座標系上の図示などから最適な形式を選択
- viewBox指定、幅600程度、背景透明
- テキスト・ラベルには fill="currentColor" を使用（テーマ自動対応）
- 線・矢印には stroke="currentColor" を使用
- 強調色が必要な場合のみ固定色（#3b82f6 青, #ef4444 赤, #22c55e 緑）
- 塗りつぶし領域は fill="currentColor" fill-opacity="0.1"
- font-family="system-ui, sans-serif"
- 図中のラベルは日本語

SVGコードのみを返してください（<svg>タグから始めて</svg>で終わる）。他のテキストは不要です。`;

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const svgMatch = text.match(/<svg[\s\S]*<\/svg>/);
  return svgMatch ? svgMatch[0] : null;
}

// ---------------------------------------------------------------------------
// Step 4: Self-review pass
// ---------------------------------------------------------------------------

async function stepReview(
  mdxContent: string,
  terms: Term[],
  svgContent: string | null,
  nodeLabel: string,
  model: string,
): Promise<string> {
  const prompt = `あなたは数学教育コンテンツのレビュアーです。以下の「${nodeLabel}」に関する学習コンテンツをレビューし、必要に応じて修正してください。

## MDXコンテンツ
${mdxContent}

## 用語集
${JSON.stringify(terms, null, 2)}

${svgContent ? `## SVG図（参考）\n（SVG図あり）` : '## SVG図\n（なし）'}

以下の観点でチェックしてください:
1. **数学的正確性**: 定義・定理に誤りがないか
2. **KaTeX数式の構文**: $...$ や $$...$$ の構文が正しいか（よくあるミス: エスケープ漏れ、括弧の不一致）
3. **具体例の充実度**: 最低3つの具体例があるか、それぞれ異なる角度から概念を照らしているか
4. **つながりの質**: 前提知識や発展先との関係が明確か
5. **読みやすさ**: 説明の流れが自然か、冗長な部分がないか

修正が必要な場合は修正版のMDXコンテンツ全体を返してください。
修正不要の場合は元のMDXコンテンツをそのまま返してください。

重要:
- MDXのみを返してください（他の説明テキストやコードブロック囲みは不要）
- 用語集やSVGは別途管理しているので、MDXに含めないでください
- 「## 他分野への応用」セクションまでで終わりにしてください`;

  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  let cleaned = text.replace(/^```(?:mdx|markdown)?\n?/, '').replace(/\n?```$/, '').trim();
  // Strip any trailing JSON (terms/glossary) that may leak from the review
  cleaned = cleaned.replace(/\n## 用語集[\s\S]*$/, '').trim();
  cleaned = cleaned.replace(/\n\[[\s]*\{[\s\S]*\][\s]*$/, '').trim();
  return cleaned;
}

// ---------------------------------------------------------------------------
// Step 5: Generate quiz questions
// ---------------------------------------------------------------------------

async function stepGenerateQuiz(
  mdxContent: string,
  nodeLabel: string,
  difficulty: number,
  model: string,
): Promise<QuizQuestion[]> {
  const questionCount = difficulty <= 2 ? 3 : difficulty <= 4 ? 4 : 5;

  const prompt = `以下は「${nodeLabel}」に関する数学の学習コンテンツです。このコンテンツの理解度を確認するための4択クイズを${questionCount}問生成してください。

---
${mdxContent.slice(0, 4000)}
---

以下の形式のJSON配列のみを返してください（他のテキストは不要）:

[
  {
    "question": "問題文",
    "choices": [
      { "text": "選択肢A", "isCorrect": false },
      { "text": "選択肢B", "isCorrect": true },
      { "text": "選択肢C", "isCorrect": false },
      { "text": "選択肢D", "isCorrect": false }
    ],
    "explanation": "正解の解説（なぜその答えが正しいのか）"
  }
]

注意:
- 各問題には必ず4つの選択肢を用意し、正解は1つだけにする
- 計算問題ではなく、概念理解を問う問題にする
- 誤答の選択肢はもっともらしいが明確に誤りであるものにする
- 解説は簡潔かつ教育的にする
- 数式が必要な場合はKaTeX形式（$...$）で記述する`;

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonArray(text, []);
}

// ---------------------------------------------------------------------------
// Main generation function (5-step pipeline)
// ---------------------------------------------------------------------------

export async function generateContent(
  nodeId: string,
  options?: { contentLevel?: string; llmModel?: string },
): Promise<GeneratedContent> {
  const node = getNode(nodeId);
  if (!node) {
    throw new Error(`Node "${nodeId}" not found in graph data`);
  }

  const model = options?.llmModel || 'claude-sonnet-4-6';
  const level = options?.contentLevel || 'standard';

  // Load prerequisite context
  const prerequisiteContext = loadPrerequisiteContents(nodeId);

  // Step 1: Generate concept MDX
  console.log(`  [step 1/4] Generating MDX for "${node.label}"...`);
  const rawMdx = await stepGenerateMDX(
    node.label, node.id, node.difficulty, node.description, node.area, level,
    prerequisiteContext, model,
  );

  // Step 2: Generate terms
  console.log(`  [step 2/4] Generating terms for "${node.label}"...`);
  const terms = await stepGenerateTerms(rawMdx, node.label, model);

  // Step 3: Generate SVG diagram
  console.log(`  [step 3/4] Generating SVG for "${node.label}"...`);
  const svg = await stepGenerateSVG(rawMdx, node.label, model);

  // Step 4: Self-review + Step 5: Quiz (in parallel)
  console.log(`  [step 4/5] Reviewing content for "${node.label}"...`);
  console.log(`  [step 5/5] Generating quiz for "${node.label}"...`);
  const [reviewedMdx, quiz] = await Promise.all([
    stepReview(rawMdx, terms, svg, node.label, model),
    stepGenerateQuiz(rawMdx, node.label, node.difficulty, model),
  ]);

  const diagrams: { name: string; svg: string }[] = svg
    ? [{ name: 'concept-diagram.svg', svg }]
    : [];

  console.log(`Content generated for "${node.label}" (${nodeId})`);

  return {
    content: reviewedMdx,
    terms,
    diagrams,
    quiz,
  };
}

// ---------------------------------------------------------------------------
// Translation function (translate existing Japanese content)
// ---------------------------------------------------------------------------

const LOCALE_LABELS: Record<string, { language: string; instruction: string }> = {
  en: {
    language: 'English',
    instruction: 'Translate the following Japanese educational content into clear, accessible English. Maintain the same MDX structure, section headings, and KaTeX math formulas exactly. Translate section headings naturally (e.g., "何か — 直感的な説明" → "What is it — Intuitive explanation"). Keep $...$ and $$...$$ math notation unchanged. Output only the translated MDX.',
  },
  zh: {
    language: '简体中文',
    instruction: '请将以下日文教育内容翻译为简体中文。保持相同的MDX结构、章节标题和KaTeX数学公式不变。自然翻译章节标题（例如："何か — 直感的な説明" → "是什么 — 直观的解释"）。保持 $...$ 和 $$...$$ 数学标记不变。只输出翻译后的MDX。',
  },
};

async function translateMDX(mdxContent: string, locale: string, model: string): Promise<string> {
  const config = LOCALE_LABELS[locale];
  if (!config) throw new Error(`Unsupported locale: ${locale}`);

  const prompt = `${config.instruction}

---
${mdxContent}
---

Important:
- Keep all KaTeX math expressions ($...$, $$...$$) exactly as they are
- Keep the MDX structure (headings, lists, etc.) intact
- Translate naturally, not word-by-word
- If a concept has no standard translation in ${config.language}, keep the original term with a brief explanation
- Output only the translated MDX (no code fences, no extra text)`;

  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return text.replace(/^```(?:mdx|markdown)?\n?/, '').replace(/\n?```$/, '').trim();
}

async function translateTerms(terms: Term[], locale: string, model: string): Promise<Term[]> {
  const config = LOCALE_LABELS[locale];
  if (!config) throw new Error(`Unsupported locale: ${locale}`);

  const prompt = `Translate the following Japanese glossary terms into ${config.language}. Return a JSON array with the same structure.

${JSON.stringify(terms, null, 2)}

Rules:
- "term": translate to ${config.language}
- "reading": ${locale === 'zh' ? 'provide pinyin' : 'leave empty string'}
- "en": keep unchanged (already in English)
- "definition": translate to ${config.language}
- Keep KaTeX math expressions unchanged
- Return only the JSON array (no extra text)`;

  const response = await client.messages.create({
    model,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonArray(text, terms);
}

async function translateQuiz(quiz: QuizQuestion[], locale: string, model: string): Promise<QuizQuestion[]> {
  if (!quiz || quiz.length === 0) return [];
  const config = LOCALE_LABELS[locale];
  if (!config) throw new Error(`Unsupported locale: ${locale}`);

  const prompt = `Translate the following quiz questions from Japanese into ${config.language}. Return a JSON array with the exact same structure.

${JSON.stringify(quiz, null, 2)}

Rules:
- Translate "question", "choices[].text", and "explanation" into ${config.language}
- Keep "isCorrect" values unchanged
- Keep KaTeX math expressions unchanged
- Return only the JSON array (no extra text)`;

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonArray(text, quiz);
}

async function translateSVG(svgContent: string, locale: string, model: string): Promise<string> {
  const config = LOCALE_LABELS[locale];
  if (!config) throw new Error(`Unsupported locale: ${locale}`);

  const prompt = `Translate the text labels in the following SVG diagram from Japanese into ${config.language}. Keep all SVG attributes, structure, and styling exactly the same. Only translate the text content within <text> elements.

${svgContent}

Return only the translated SVG (from <svg> to </svg>). No extra text.`;

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const svgMatch = text.match(/<svg[\s\S]*<\/svg>/);
  return svgMatch ? svgMatch[0] : svgContent;
}

export async function translateContent(
  jaContent: GeneratedContent,
  locale: string,
  options?: { llmModel?: string },
): Promise<GeneratedContent> {
  const model = options?.llmModel || 'claude-sonnet-4-6';

  console.log(`  [step 1/3] Translating MDX to ${locale}...`);
  const translatedMdx = await translateMDX(jaContent.content, locale, model);

  console.log(`  [step 2/3] Translating terms + quiz to ${locale}...`);
  const [translatedTerms, translatedQuiz] = await Promise.all([
    translateTerms(jaContent.terms, locale, model),
    translateQuiz(jaContent.quiz, locale, model),
  ]);

  console.log(`  [step 3/3] Translating diagrams to ${locale}...`);
  const translatedDiagrams = await Promise.all(
    jaContent.diagrams.map(async (d) => ({
      name: d.name,
      svg: await translateSVG(d.svg, locale, model),
    })),
  );

  return {
    content: translatedMdx,
    terms: translatedTerms,
    diagrams: translatedDiagrams,
    quiz: translatedQuiz,
  };
}

// ---------------------------------------------------------------------------
// Standalone quiz generation (for --quiz-only mode)
// ---------------------------------------------------------------------------

export async function generateQuizOnly(
  nodeId: string,
  mdxContent: string,
  options?: { llmModel?: string },
): Promise<QuizQuestion[]> {
  const node = getNode(nodeId);
  if (!node) {
    throw new Error(`Node "${nodeId}" not found in graph data`);
  }

  const model = options?.llmModel || 'claude-sonnet-4-6';
  console.log(`  Generating quiz for "${node.label}"...`);
  return stepGenerateQuiz(mdxContent, node.label, node.difficulty, model);
}
