import { useState } from 'react'
import s from './NewModuleDialog.module.css'

interface Props {
  onConfirm(folderName: string, name: string, description: string): void
  onCancel(): void
}

function toFolderName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function NewModuleDialog({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const folderName = toFolderName(name)

  function submit() {
    if (!name.trim()) { setError('Name is required'); return }
    if (!folderName)  { setError('Cannot derive a valid folder name'); return }
    onConfirm(folderName, name.trim(), description.trim())
  }

  return (
    <div className={s.overlay} onClick={onCancel}>
      <div className={s.dialog} onClick={e => e.stopPropagation()}>
        <h2 className={s.title}>New Module</h2>
        <div className={s.field}>
          <label className={s.label}>Name</label>
          <input
            className={s.input}
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            placeholder="e.g. Auth Service"
          />
          {name && <div style={{ fontSize: '0.7rem', color: 'var(--overlay0)', marginTop: 2 }}>folder: {folderName || '—'}</div>}
          {error && <div className={s.error}>{error}</div>}
        </div>
        <div className={s.field}>
          <label className={s.label}>Description (one sentence)</label>
          <input
            className={s.input}
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="What this module does"
          />
        </div>
        <div className={s.actions}>
          <button className={s.btn} onClick={onCancel}>Cancel</button>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={submit}>Create</button>
        </div>
      </div>
    </div>
  )
}
