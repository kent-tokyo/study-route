'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import SphereNode from './SphereNode';
import SphereEdge from './SphereEdge';
import AreaNode from './AreaNode';
import type { GraphNode, GraphEdge, NodeStatus, AreaMeta } from '@/types';
import { useViewportPersistence } from '@/hooks/useViewportPersistence';
import { useLocale } from '@/i18n/useLocale';
import { localize } from '@/i18n/localize';

const nodeTypes = { sphere: SphereNode, area: AreaNode };
const edgeTypes = { sphere: SphereEdge };

interface SphereGridProps {
  level: 'area' | 'detail';
  // Area level props
  areas?: AreaMeta[];
  areaEdges?: GraphEdge[];
  areaNodeCounts?: Record<string, { completed: number; total: number }>;
  onAreaClick?: (areaId: string) => void;
  // Detail level props
  mathNodes?: GraphNode[];
  mathEdges?: GraphEdge[];
  nodeStatuses?: Record<string, NodeStatus>;
  // Viewport persistence key
  viewportKey: string;
  // Domain for navigation
  domain?: string;
}

export default function SphereGrid({
  level,
  areas,
  areaEdges,
  areaNodeCounts,
  onAreaClick,
  mathNodes,
  mathEdges,
  nodeStatuses,
  viewportKey,
  domain,
}: SphereGridProps) {
  const router = useRouter();
  const { savedViewport, saveViewport } = useViewportPersistence(viewportKey);
  const { locale } = useLocale();

  const handleNodeClick = useCallback((nodeId: string) => {
    const prefix = domain ? `/${domain}` : '';
    router.push(`${prefix}/learn/${nodeId}`);
  }, [router, domain]);

  const handleAreaClick = useCallback((areaId: string) => {
    onAreaClick?.(areaId);
  }, [onAreaClick]);

  const nodes: Node[] = useMemo(() => {
    if (level === 'area' && areas) {
      return areas.map(a => ({
        id: a.id,
        type: 'area',
        position: a.position,
        draggable: false,
        data: {
          label: localize(locale, a.label, a.labels),
          description: localize(locale, a.description, a.descriptions),
          color: a.color,
          completedCount: areaNodeCounts?.[a.id]?.completed ?? 0,
          totalCount: areaNodeCounts?.[a.id]?.total ?? 0,
          onClick: handleAreaClick,
        },
      }));
    }
    if (level === 'detail' && mathNodes) {
      return mathNodes.map(n => ({
        id: n.id,
        type: 'sphere',
        position: n.position,
        draggable: false,
        data: {
          label: localize(locale, n.label, n.labels),
          number: n.number,
          description: localize(locale, n.description, n.descriptions),
          area: n.area,
          difficulty: n.difficulty,
          status: nodeStatuses?.[n.id] || 'locked',
          onClick: handleNodeClick,
        },
      }));
    }
    return [];
  }, [level, areas, areaNodeCounts, handleAreaClick, mathNodes, nodeStatuses, handleNodeClick, locale]);

  const edges: Edge[] = useMemo(() => {
    const edgeList = level === 'area' ? areaEdges : mathEdges;
    if (!edgeList) return [];
    return edgeList.map(e => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'sphere',
    }));
  }, [level, areaEdges, mathEdges]);

  const handleMoveEnd = useCallback((_event: unknown, viewport: Viewport) => {
    saveViewport(viewport);
  }, [saveViewport]);

  const defaultViewport = savedViewport ?? undefined;
  const shouldFitView = !savedViewport;

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={shouldFitView}
        defaultViewport={defaultViewport}
        onMoveEnd={handleMoveEnd}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="currentColor"
          className="text-zinc-200 dark:text-zinc-800"
          gap={20}
        />
        <Controls
          showInteractive={false}
          className="!bg-white dark:!bg-zinc-800 !border-zinc-300 dark:!border-zinc-700 !shadow-lg [&>button]:!bg-white dark:[&>button]:!bg-zinc-800 [&>button]:!border-zinc-300 dark:[&>button]:!border-zinc-700 [&>button]:!text-zinc-600 dark:[&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-100 dark:[&>button:hover]:!bg-zinc-700"
        />
        <MiniMap
          nodeColor={(node) => {
            if (level === 'area') {
              return (node.data as { color: string }).color || '#a1a1aa';
            }
            const status = (node.data as { status: NodeStatus }).status;
            switch (status) {
              case 'completed': return '#10b981';
              case 'in_progress': return '#3b82f6';
              case 'available': return '#a1a1aa';
              default: return '#3f3f46';
            }
          }}
          className="!bg-zinc-100 dark:!bg-zinc-900 !border-zinc-300 dark:!border-zinc-700"
          maskColor="rgba(128, 128, 128, 0.3)"
        />
      </ReactFlow>
    </div>
  );
}
