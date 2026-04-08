import { useState } from 'react'
import { openDirectory } from '../../filesystem/fsa'
import serverAdapter from '../../filesystem/serverAdapter'
import { useCanvasStore } from '../../store/canvas'
import s from './OpenFolder.module.css'

export function OpenFolder() {
  const setAdapter = useCanvasStore(s => s.setAdapter)
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001')
  const [showUrl, setShowUrl] = useState(false)

  async function handleFsa() {
    try {
      const { adapter, root } = await openDirectory()
      await setAdapter(adapter, '/', 'fsa')
      void root // keep reference
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    }
  }

  async function handleServer() {
    // serverAdapter reads VITE_SERVER_URL from env at import time, but
    // for dynamic URL we just point the user to set the env var.
    await setAdapter(serverAdapter, '.', 'server')
  }

  return (
    <div className={s.root}>
      <div className={s.logo}>ArchUI</div>
      <div className={s.subtitle}>Knowledge canvas for humans & AI agents</div>
      <div className={s.card}>
        <button className={s.btn} onClick={handleServer}>
          Connect to local server
        </button>
        <span className={s.divider}>or</span>
        <button className={`${s.btn} ${s.btnSecondary}`} onClick={handleFsa}>
          Open folder (FSA — Chrome/Edge)
        </button>
        {showUrl && (
          <div className={s.urlRow}>
            <input
              className={s.urlInput}
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>
        )}
        <button
          className={`${s.btn} ${s.btnSecondary}`}
          style={{ fontSize: '0.75rem', padding: '4px 0' }}
          onClick={() => setShowUrl(v => !v)}
        >
          {showUrl ? 'Hide server URL' : 'Change server URL'}
        </button>
      </div>
    </div>
  )
}
