import type { GraphData, AreaMeta, AreaId, GraphEdge } from '@/types';
import type { DomainId, DomainMeta } from '@/types/domain';

// --- Math data ---
import mathFoundations from './math/foundations.json';
import mathPureMath from './math/pure-math.json';
import mathApplied from './math/applied-math.json';
import mathAreas from './math/areas.json';

// --- Philosophy data ---
import philosophyAreas from './philosophy/areas.json';
import philosophyTopics from './philosophy/topics.json';

// --- AWS data ---
import awsAreas from './aws/areas.json';
import awsTopics from './aws/topics.json';

// --- CS data ---
import csAreas from './cs/areas.json';
import csTopics from './cs/topics.json';

// --- Chemistry data ---
import chemistryAreas from './chemistry/areas.json';
import chemistryTopics from './chemistry/topics.json';

// --- Accounting data ---
import accountingAreas from './accounting/areas.json';
import accountingTopics from './accounting/topics.json';

// --- Domains ---
import domainsData from './domains.json';

// Legacy re-exports (backward-compat for existing imports)
import foundationsData from './foundations.json';
import pureMathData from './pure-math.json';
import appliedMathData from './applied-math.json';
import areasData from './areas.json';

export function getDomains(): DomainMeta[] {
  return domainsData as unknown as DomainMeta[];
}

export function getDomainIds(): DomainId[] {
  return getDomains().map(d => d.id);
}

/** Build area-to-domain lookup from domains.json areaOrder */
export function getAreaToDomainMap(): Record<string, DomainId> {
  const map: Record<string, DomainId> = {};
  for (const d of getDomains()) {
    for (const area of d.areaOrder) {
      map[area] = d.id;
    }
  }
  return map;
}

export function getAllGraphData(domainId?: DomainId): GraphData {
  switch (domainId) {
    case 'philosophy':
      return { nodes: philosophyTopics.nodes as GraphData['nodes'], edges: philosophyTopics.edges };
    case 'aws':
      return { nodes: awsTopics.nodes as GraphData['nodes'], edges: awsTopics.edges };
    case 'cs':
      return { nodes: csTopics.nodes as GraphData['nodes'], edges: csTopics.edges };
    case 'chemistry':
      return { nodes: chemistryTopics.nodes as GraphData['nodes'], edges: chemistryTopics.edges };
    case 'accounting':
      return { nodes: accountingTopics.nodes as GraphData['nodes'], edges: accountingTopics.edges };
    case 'math':
    default: {
      const nodes = [...mathFoundations.nodes, ...mathPureMath.nodes, ...mathApplied.nodes];
      const edges = [...mathFoundations.edges, ...mathPureMath.edges, ...mathApplied.edges];
      return { nodes, edges } as GraphData;
    }
  }
}

export function getAreaMeta(domainId?: DomainId): AreaMeta[] {
  switch (domainId) {
    case 'philosophy': return philosophyAreas as AreaMeta[];
    case 'aws': return awsAreas as AreaMeta[];
    case 'cs': return csAreas as AreaMeta[];
    case 'chemistry': return chemistryAreas as AreaMeta[];
    case 'accounting': return accountingAreas as AreaMeta[];
    case 'math':
    default: return mathAreas as AreaMeta[];
  }
}

/** Derive inter-area edges by aggregating cross-area edges from the full graph */
export function getAreaEdges(domainId?: DomainId): GraphEdge[] {
  const graph = getAllGraphData(domainId);
  const nodeAreaMap = new Map<string, AreaId>();
  for (const n of graph.nodes) {
    nodeAreaMap.set(n.id, n.area);
  }

  const seen = new Set<string>();
  const areaEdges: GraphEdge[] = [];

  for (const e of graph.edges) {
    const srcArea = nodeAreaMap.get(e.source);
    const tgtArea = nodeAreaMap.get(e.target);
    if (srcArea && tgtArea && srcArea !== tgtArea) {
      const key = `${srcArea}-${tgtArea}`;
      if (!seen.has(key)) {
        seen.add(key);
        areaEdges.push({ source: srcArea, target: tgtArea });
      }
    }
  }

  return areaEdges;
}

/** Get nodes and edges within a specific area (plus cross-area edges touching area nodes) */
export function getNodesByArea(areaId: AreaId, domainId?: DomainId): GraphData {
  const graph = getAllGraphData(domainId);
  const areaNodes = graph.nodes.filter(n => n.area === areaId);
  const areaNodeIds = new Set(areaNodes.map(n => n.id));
  const areaEdges = graph.edges.filter(
    e => areaNodeIds.has(e.source) && areaNodeIds.has(e.target)
  );
  return { nodes: areaNodes, edges: areaEdges };
}
