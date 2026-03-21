/**
 * Adds "number" field (e.g. "01-01") to all nodes in graph JSON files.
 * Area order is defined per domain; node order is topological within each area.
 */
import fs from 'fs';
import path from 'path';

const GRAPH_DIR = path.join(process.cwd(), 'src', 'data', 'graph');

// Area ordering per domain
const AREA_ORDER: Record<string, string[]> = {
  math: ['foundations', 'pure_algebra', 'pure_analysis', 'pure_geometry', 'stochastic', 'computational', 'mathematical_modeling', 'social'],
  philosophy: ['logic', 'epistemology', 'ethics', 'metaphysics', 'aesthetics'],
  aws: ['compute', 'networking', 'storage', 'security', 'databases', 'ai_ml', 'management', 'app_integration'],
  cs: ['foundations_cs', 'algorithms', 'systems', 'networking_cs', 'pl', 'ai_cs'],
  chemistry: ['general_chem', 'organic', 'inorganic', 'physical', 'analytical', 'biochem'],
  accounting: ['bookkeeping', 'financial_statements', 'cost_accounting', 'tax_accounting', 'management_accounting', 'auditing'],
};

interface Node {
  id: string;
  area: string;
  prerequisites: string[];
  number?: string;
  [key: string]: unknown;
}

function topoSort(nodes: Node[]): Node[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inArea = new Set(nodes.map(n => n.id));
  const visited = new Set<string>();
  const result: Node[] = [];

  function visit(id: string) {
    if (visited.has(id) || !inArea.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id)!;
    for (const prereq of node.prerequisites) {
      if (inArea.has(prereq)) visit(prereq);
    }
    result.push(node);
  }

  for (const n of nodes) visit(n.id);
  return result;
}

function processFile(filePath: string, areaOrder: string[]) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const nodes: Node[] = data.nodes;

  const areaMap = new Map<string, number>();
  areaOrder.forEach((area, i) => areaMap.set(area, i + 1));

  for (const area of areaOrder) {
    const areaNodes = nodes.filter(n => n.area === area);
    const sorted = topoSort(areaNodes);
    const areaNum = (areaMap.get(area) ?? 0).toString().padStart(2, '0');
    sorted.forEach((node, i) => {
      node.number = `${areaNum}-${(i + 1).toString().padStart(2, '0')}`;
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  Updated ${filePath} (${nodes.length} nodes)`);
}

// Math has 3 files
function processMath() {
  const areaOrder = AREA_ORDER.math;
  const files = ['foundations.json', 'pure-math.json', 'applied-math.json'];

  // Load all nodes to do global area numbering
  const allNodes: { file: string; data: { nodes: Node[]; edges: unknown[] } }[] = [];
  for (const f of files) {
    const filePath = path.join(GRAPH_DIR, 'math', f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allNodes.push({ file: filePath, data });
  }

  const flatNodes = allNodes.flatMap(f => f.data.nodes);
  const areaMap = new Map<string, number>();
  areaOrder.forEach((area, i) => areaMap.set(area, i + 1));

  for (const area of areaOrder) {
    const areaNodes = flatNodes.filter(n => n.area === area);
    const sorted = topoSort(areaNodes);
    const areaNum = (areaMap.get(area) ?? 0).toString().padStart(2, '0');
    sorted.forEach((node, i) => {
      node.number = `${areaNum}-${(i + 1).toString().padStart(2, '0')}`;
    });
  }

  for (const f of allNodes) {
    fs.writeFileSync(f.file, JSON.stringify(f.data, null, 2) + '\n');
    console.log(`  Updated ${f.file} (${f.data.nodes.length} nodes)`);
  }
}

// Single-file domains
function processDomain(domain: string) {
  const filePath = path.join(GRAPH_DIR, domain, 'topics.json');
  processFile(filePath, AREA_ORDER[domain]);
}

console.log('Adding numbers to graph nodes...\n');

console.log('Math:');
processMath();

for (const domain of ['philosophy', 'aws', 'cs', 'chemistry', 'accounting']) {
  console.log(`\n${domain}:`);
  processDomain(domain);
}

console.log('\nDone!');
