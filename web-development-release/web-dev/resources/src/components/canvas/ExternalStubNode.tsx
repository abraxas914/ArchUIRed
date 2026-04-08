import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import s from './ExternalStubNode.module.css'

export interface ExternalStubNodeData {
  uuid: string
  relation?: string
  label?: string
}

export function ExternalStubNode({ data }: NodeProps & { data: ExternalStubNodeData }) {
  return (
    <div className={s.node}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className={s.label}>{data.label ?? 'External module'}</div>
      <div className={s.uuid}>{data.uuid}</div>
      {data.relation && <div className={s.tag}>{data.relation}</div>}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
