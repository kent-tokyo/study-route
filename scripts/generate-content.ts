import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateContent } from '../src/lib/content-generator';
import { generateConceptImage } from '../src/lib/image-generator';
import { getAllNodes } from '../src/lib/graph';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'content');
const CONTENT_LEVELS = ['beginner', 'standard', 'advanced'] as const;
const MAX_CONCURRENCY = 3;

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    nodes: [] as string[],
    all: false,
    level: null as string | null,
    allLevels: false,
    withImages: false,
    force: false,
    dryRun: false,
    model: null as string | null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--node':
        flags.nodes.push(args[++i]);
        break;
      case '--all':
        flags.all = true;
        break;
      case '--level':
        flags.level = args[++i];
        break;
      case '--all-levels':
        flags.allLevels = true;
        break;
      case '--with-images':
        flags.withImages = true;
        break;
      case '--force':
        flags.force = true;
        break;
      case '--dry-run':
        flags.dryRun = true;
        break;
      case '--model':
        flags.model = args[++i];
        break;
    }
  }

  return flags;
}

function getTargetNodeIds(flags: ReturnType<typeof parseArgs>): string[] {
  if (flags.all) {
    return getAllNodes().map(n => n.id);
  }
  if (flags.nodes.length > 0) {
    return flags.nodes;
  }
  console.error('Usage: npx tsx scripts/generate-content.ts --node <nodeId> [--node <nodeId2> ...] | --all [--level <level>] [--all-levels] [--with-images] [--force] [--dry-run] [--model <model>]');
  process.exit(1);
}

function getTargetLevels(flags: ReturnType<typeof parseArgs>): string[] {
  if (flags.allLevels) {
    return [...CONTENT_LEVELS];
  }
  if (flags.level) {
    if (!CONTENT_LEVELS.includes(flags.level as typeof CONTENT_LEVELS[number])) {
      console.error(`Invalid level: ${flags.level}. Must be one of: ${CONTENT_LEVELS.join(', ')}`);
      process.exit(1);
    }
    return [flags.level];
  }
  return ['standard'];
}

function contentExists(nodeId: string, level: string): boolean {
  return fs.existsSync(path.join(OUTPUT_DIR, nodeId, level, 'content.json'));
}

interface ManifestEntry {
  levels: string[];
  hasIllustration: Record<string, boolean>;
}

function loadManifest(): Record<string, ManifestEntry> {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }
  return {};
}

function saveManifest(manifest: Record<string, ManifestEntry>): void {
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
}

function updateContentsTable(manifest: Record<string, ManifestEntry>): void {
  const nodes = getAllNodes();
  const rows = nodes.map(node => {
    const entry = manifest[node.id];
    const beginner = entry?.levels.includes('beginner') ? 'done' : '-';
    const standard = entry?.levels.includes('standard') ? 'done' : '-';
    const advanced = entry?.levels.includes('advanced') ? 'done' : '-';
    const reviewed = '-';
    return `| ${node.id} | ${node.label} | ${node.area} | ${beginner} | ${standard} | ${advanced} | ${reviewed} |`;
  });

  const table = `# Content Generation Status
Last updated: ${new Date().toISOString().split('T')[0]}

| Node ID | Label | Area | Beginner | Standard | Advanced | Reviewed |
|---------|-------|------|----------|----------|----------|----------|
${rows.join('\n')}
`;

  fs.writeFileSync(path.join(process.cwd(), 'contents-table.md'), table);
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  const executing = new Set<Promise<void>>();

  for (const task of tasks) {
    const p = task().then(r => { results.push(r); });
    const wrapped = p.then(() => { executing.delete(wrapped); });
    executing.add(wrapped);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

async function main() {
  const flags = parseArgs();
  const nodeIds = getTargetNodeIds(flags);
  const levels = getTargetLevels(flags);
  const modelName = flags.model || 'claude-sonnet-4-6';

  console.log(`Target: ${nodeIds.length} node(s) × ${levels.length} level(s) = ${nodeIds.length * levels.length} combination(s)`);
  console.log(`Model: ${modelName}`);
  if (flags.withImages) console.log('Image generation: enabled');
  if (flags.force) console.log('Force mode: overwriting existing content');

  const jobs: { nodeId: string; level: string }[] = [];
  for (const nodeId of nodeIds) {
    for (const level of levels) {
      if (!flags.force && contentExists(nodeId, level)) {
        console.log(`  [skip] ${nodeId}/${level} (already exists)`);
        continue;
      }
      jobs.push({ nodeId, level });
    }
  }

  if (flags.dryRun) {
    console.log(`\nDry run: ${jobs.length} job(s) would be executed:`);
    for (const job of jobs) {
      console.log(`  - ${job.nodeId} (${job.level})`);
    }
    return;
  }

  if (jobs.length === 0) {
    console.log('No jobs to execute. Use --force to regenerate existing content.');
  } else {
    console.log(`\nExecuting ${jobs.length} job(s) with concurrency ${MAX_CONCURRENCY}...`);

    const tasks = jobs.map(job => async () => {
      const label = `${job.nodeId}/${job.level}`;
      console.log(`  [start] ${label}`);

      let result;
      try {
        result = await generateContent(job.nodeId, {
          contentLevel: job.level,
          llmModel: modelName,
        });
      } catch (err) {
        console.error(`  [error] ${label}: ${(err as Error).message}`);
        return { nodeId: job.nodeId, level: job.level, error: true };
      }

      // Save to public/content/{nodeId}/{level}/content.json
      const outDir = path.join(OUTPUT_DIR, job.nodeId, job.level);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'content.json'),
        JSON.stringify({
          id: crypto.randomUUID(),
          nodeId: job.nodeId,
          level: job.level,
          generatedAt: new Date().toISOString(),
          content: result.content,
          terms: result.terms,
          diagrams: result.diagrams,
        }, null, 2),
      );

      // Generate illustration if requested
      if (flags.withImages) {
        const node = getAllNodes().find(n => n.id === job.nodeId);
        if (node) {
          try {
            const img = await generateConceptImage(node.label, node.description);
            if (img?.url) {
              const res = await fetch(img.url);
              const buffer = Buffer.from(await res.arrayBuffer());
              fs.writeFileSync(path.join(outDir, 'illustration.webp'), buffer);
              console.log(`  [image] ${label}`);
            }
          } catch (err) {
            console.warn(`  [image-error] ${label}: ${(err as Error).message}`);
          }
        }
      }

      console.log(`  [done] ${label}`);
      return { nodeId: job.nodeId, level: job.level };
    });

    await runWithConcurrency(tasks, MAX_CONCURRENCY);
  }

  // Update manifest
  const manifest = loadManifest();
  for (const nodeId of nodeIds) {
    if (!manifest[nodeId]) {
      manifest[nodeId] = { levels: [], hasIllustration: {} };
    }
    for (const level of levels) {
      if (contentExists(nodeId, level)) {
        if (!manifest[nodeId].levels.includes(level)) {
          manifest[nodeId].levels.push(level);
        }
        manifest[nodeId].hasIllustration[level] = fs.existsSync(
          path.join(OUTPUT_DIR, nodeId, level, 'illustration.webp'),
        );
      }
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  saveManifest(manifest);
  updateContentsTable(manifest);

  console.log('\nManifest and contents-table.md updated.');
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
