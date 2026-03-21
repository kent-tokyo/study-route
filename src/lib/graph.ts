import { getAllGraphData, getDomainIds } from '@/data/graph';
import type { GraphNode, NodeStatus } from '@/types';
import type { DomainId } from '@/types/domain';

// Cache per domain
const cache = new Map<string, ReturnType<typeof getAllGraphData>>();

function getGraphData(domainId?: DomainId) {
  const key = domainId || 'math';
  if (!cache.has(key)) {
    cache.set(key, getAllGraphData(domainId));
  }
  return cache.get(key)!;
}

export function getAllNodes(domainId?: DomainId): GraphNode[] {
  return getGraphData(domainId).nodes;
}

export function getAllEdges(domainId?: DomainId) {
  return getGraphData(domainId).edges;
}

export function getNode(nodeId: string, domainId?: DomainId): GraphNode | undefined {
  // Search specified domain first, then fall back to all domains
  const result = getGraphData(domainId).nodes.find(n => n.id === nodeId);
  if (result) return result;

  // Fallback: search across all domains
  for (const d of getDomainIds()) {
    const found = getGraphData(d).nodes.find(n => n.id === nodeId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Compute which nodes are available based on completed nodes.
 * A node is available if all its prerequisites are completed.
 * The root nodes (no prerequisites) start as available.
 */
export function computeNodeStatuses(
  completedNodeIds: Set<string>,
  inProgressNodeIds: Set<string>,
  domainId?: DomainId,
): Map<string, NodeStatus> {
  const statuses = new Map<string, NodeStatus>();
  const graphData = getGraphData(domainId);

  for (const node of graphData.nodes) {
    if (completedNodeIds.has(node.id)) {
      statuses.set(node.id, 'completed');
    } else if (inProgressNodeIds.has(node.id)) {
      statuses.set(node.id, 'in_progress');
    } else {
      const allPrereqsMet = node.prerequisites.length === 0 ||
        node.prerequisites.every(pid => completedNodeIds.has(pid));
      statuses.set(node.id, allPrereqsMet ? 'available' : 'locked');
    }
  }

  return statuses;
}
