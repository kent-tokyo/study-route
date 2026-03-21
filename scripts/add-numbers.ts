/**
 * Adds "number" field (e.g. "01-001") to all nodes in graph JSON files.
 * Format: DD-NNN (domain prefix + domain-wide sequential number).
 * Matches contents-table.md numbering.
 * Domain config (prefix, areaOrder) is read from domains.json.
 */
import fs from 'fs';
import path from 'path';

const GRAPH_DIR = path.join(process.cwd(), 'src', 'data', 'graph');

interface DomainConfig {
  id: string;
  prefix: string;
  areaOrder: string[];
}

const domains: DomainConfig[] = JSON.parse(
  fs.readFileSync(path.join(GRAPH_DIR, 'domains.json'), 'utf-8')
);

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

function getOrderedNodes(allNodes: Node[], areaOrder: string[]): Node[] {
  const ordered: Node[] = [];
  for (const area of areaOrder) {
    const areaNodes = allNodes.filter(n => n.area === area);
    ordered.push(...topoSort(areaNodes));
  }
  return ordered;
}

function assignNumbers(nodes: Node[], prefix: string): void {
  nodes.forEach((node, i) => {
    node.number = `${prefix}-${(i + 1).toString().padStart(3, '0')}`;
  });
}

// Math has 3 files, others have 1
function processDomain(domain: DomainConfig) {
  const domainDir = path.join(GRAPH_DIR, domain.id);
  let files: string[];

  if (domain.id === 'math') {
    files = ['foundations.json', 'pure-math.json', 'applied-math.json'];
  } else {
    files = ['topics.json'];
  }

  const allData: { file: string; data: { nodes: Node[]; edges: unknown[] } }[] = [];
  for (const f of files) {
    const filePath = path.join(domainDir, f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allData.push({ file: filePath, data });
  }

  const flatNodes = allData.flatMap(f => f.data.nodes);
  const ordered = getOrderedNodes(flatNodes, domain.areaOrder);
  assignNumbers(ordered, domain.prefix);

  for (const f of allData) {
    fs.writeFileSync(f.file, JSON.stringify(f.data, null, 2) + '\n');
    console.log(`  Updated ${f.file} (${f.data.nodes.length} nodes)`);
  }
}

console.log('Adding numbers to graph nodes...\n');

for (const domain of domains) {
  console.log(`${domain.id}:`);
  processDomain(domain);
  console.log();
}

console.log('Done!');
