'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeStatus } from '@/types';

interface SphereNodeData {
  label: string;
  number?: string;
  description: string;
  area: string;
  difficulty: number;
  status: NodeStatus;
  onClick: (nodeId: string) => void;
  [key: string]: unknown;
}

const STATUS_STYLES: Record<NodeStatus, string> = {
  locked: 'border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-70',
  available: 'border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 cursor-pointer hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10',
  in_progress: 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-100 cursor-pointer ring-2 ring-blue-500/30',
  completed: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-100 cursor-pointer',
};

const AREA_COLORS: Record<string, string> = {
  foundations: 'bg-amber-500',
  pure_algebra: 'bg-violet-500',
  pure_analysis: 'bg-rose-500',
  pure_geometry: 'bg-cyan-500',
  stochastic: 'bg-teal-500',
  computational: 'bg-blue-500',
  mathematical_modeling: 'bg-red-500',
  social: 'bg-orange-500',
};

export default function SphereNode({ id, data }: { id: string; data: SphereNodeData }) {
  const { label, description, area, status, onClick } = data;
  const isClickable = status !== 'locked';

  return (
    <div
      className={`relative rounded-lg border-2 px-4 py-3 min-w-[140px] max-w-[180px] transition-all ${STATUS_STYLES[status]}`}
      onClick={() => isClickable && onClick(id)}
      title={description}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-400 dark:!bg-zinc-600 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-zinc-400 dark:!bg-zinc-600 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${AREA_COLORS[area] || 'bg-zinc-500'}`} />
        <span className="text-xs text-zinc-400 dark:text-zinc-400">
          {'★'.repeat(data.difficulty)}
        </span>
      </div>
      <div className="text-sm font-semibold leading-tight">
        {data.number && <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mr-1">{data.number}</span>}
        {label}
      </div>

      {status === 'completed' && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
          ✓
        </div>
      )}
    </div>
  );
}
