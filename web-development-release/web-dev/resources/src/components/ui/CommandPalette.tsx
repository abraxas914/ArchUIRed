import { useEffect, useRef, useState } from 'react'
import s from './CommandPalette.module.css'

export interface Command {
  id: string
  label: string
  hint?: string
  icon?: string
  action(): void
}

interface Props {
  commands: Command[]
  onClose(): void
}

export function CommandPalette({ commands, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setActive(0) }, [query])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[active]) { filtered[active].action(); onClose() }
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.palette} onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <input
          ref={inputRef}
          className={s.input}
          placeholder="Search commands…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className={s.list}>
          {filtered.length === 0
            ? <div className={s.empty}>No commands found</div>
            : filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                className={`${s.item} ${i === active ? s.itemActive : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => { cmd.action(); onClose() }}
              >
                {cmd.icon && <span className={s.itemIcon}>{cmd.icon}</span>}
                <span className={s.itemLabel}>{cmd.label}</span>
                {cmd.hint && <span className={s.itemHint}>{cmd.hint}</span>}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
