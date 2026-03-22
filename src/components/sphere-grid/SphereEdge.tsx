'use client';

import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export default function SphereEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;

  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);

  // Nearly aligned nodes: small offset for straight edges.
  // Diagonal/offset connections: large offset to route around intermediate nodes.
  let offset: number;
  if (dy < 20) {
    // Horizontal alignment — keep straight
    offset = 10;
  } else if (dx < 20) {
    // Vertical alignment — keep straight
    offset = 10;
  } else if (dy > dx * 0.8) {
    // Mainly vertical with horizontal offset — large to avoid node overlap
    offset = 80;
  } else {
    // Diagonal — needs room to route around nodes
    offset = 50;
  }

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
    offset,
  });

  return (
    <BaseEdge
      {...props}
      path={edgePath}
      className="[&>path]:!stroke-zinc-300 dark:[&>path]:!stroke-zinc-600"
      style={{ strokeWidth: 2 }}
    />
  );
}
