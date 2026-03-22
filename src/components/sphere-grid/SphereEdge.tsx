'use client';

import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export default function SphereEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;

  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);

  // Use small offset for well-aligned nodes (nearly horizontal or vertical)
  // to keep edges straight. Only use large offset for diagonal connections
  // where edges need to route around node boxes.
  let offset: number;
  if (dy < 20) {
    offset = 10;
  } else if (dx < 20) {
    offset = 10;
  } else if (dy > dx * 0.8) {
    offset = 60;
  } else {
    offset = 35;
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
