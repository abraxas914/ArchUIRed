import { useEffect, useRef } from 'react'
import s from './ContextMenu.module.css'

export interface MenuItem {
  id: string
  label: string
  icon?: string
  danger?: boolean
  action(): void
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose(): void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  return (
    <div
      ref={ref}
      className={s.menu}
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        item.id === 'sep'
          ? <div key={i} className={s.sep} />
          : <div
              key={item.id}
              className={`${s.item} ${item.danger ? s.itemDanger : ''}`}
              onClick={() => { item.action(); onClose() }}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
      ))}
    </div>
  )
}
