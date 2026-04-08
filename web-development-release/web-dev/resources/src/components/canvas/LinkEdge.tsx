import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import s from './LinkEdge.module.css'

export interface LinkEdgeData {
  relation?: string
}

export function LinkEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps & { data?: LinkEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: 'var(--edge-color)', strokeWidth: 1.5, ...style }}
      />
      {data?.relation && (
        <EdgeLabelRenderer>
          <div
            className={s.label}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {data.relation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
