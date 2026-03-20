import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { getNode, getAllNodes } from './graph';
import type { Term } from '@/types';

export interface GeneratedContent {
  content: string;
  terms: Term[];
  diagrams: { name: string; svg: string }[];
}

const client = new Anthropic();

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
    const contentPath = path.join(OUTPUT_DIR, prereqId, 'standard', 'content.json');
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

  const prompt = `あなたは数学教育の専門家です。以下の数学概念について、MDX形式の概念説明コンテンツを生成してください。

概念: ${nodeLabel}（${nodeId}）
難易度: ${difficulty}/5
概要: ${description}
分野: ${area}

${levelInstruction}

${difficultyInstruction}
${prerequisiteContext}

以下の構成でMDXコンテンツを書いてください（JSON不要、MDXそのものを返してください）:

# ${nodeLabel}

## 何か — 直感的な説明
（この概念を一言で説明し、初めて出会う読者が「ああ、こういうことか」と思える導入）

## なぜ必要か — 数学における位置づけ
（この概念が数学のどこで使われ、なぜ重要なのか）

## 核となるアイデア — 定義・定理の本質
（数式は $...$ や $$...$$ のKaTeX形式で。中心的な定義や定理を正確に述べる）

## 具体例
（最低3つの具体例を挙げる。それぞれ異なる角度から概念を照らすこと）

## つながり — 他の概念との関係
（前提知識や発展先との関係を明示する）

## 他分野への応用
（物理・化学・経済学・工学・コンピュータサイエンスなどでこの概念がどう使われるか）

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
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    const fixed = jsonMatch[0].replace(/[\x00-\x1f]/g, (ch) => {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\t') return '\\t';
      return '';
    });
    return JSON.parse(fixed);
  }
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
// Main generation function (4-step pipeline)
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

  // Step 4: Self-review
  console.log(`  [step 4/4] Reviewing content for "${node.label}"...`);
  const reviewedMdx = await stepReview(rawMdx, terms, svg, node.label, model);

  const diagrams: { name: string; svg: string }[] = svg
    ? [{ name: 'concept-diagram.svg', svg }]
    : [];

  console.log(`Content generated for "${node.label}" (${nodeId})`);

  return {
    content: reviewedMdx,
    terms,
    diagrams,
  };
}
