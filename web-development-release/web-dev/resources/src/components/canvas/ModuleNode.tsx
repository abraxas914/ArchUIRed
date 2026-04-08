import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { ChildModule } from '../../types'
import s from './ModuleNode.module.css'

export interface ModuleNodeData {
  child: ChildModule
  submoduleCount: number
}

export function ModuleNode({ data, selected }: NodeProps & { data: ModuleNodeData }) {
  const { child, submoduleCount } = data

  return (
    <div className={`${s.node} ${selected ? s.nodeSelected : ''}`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className={s.name} title={child.name}>{child.name}</div>
      {child.description && (
        <div className={s.desc}>{child.description}</div>
      )}
      {submoduleCount > 0 && (
        <div className={s.badge}>
          <span>⬡</span>
          <span>{submoduleCount}</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
