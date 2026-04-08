import { useEffect } from 'react'
import { useCanvasStore, detectServerRoot } from './store/canvas'
import serverAdapter from './filesystem/serverAdapter'
import { OpenFolder } from './components/ui/OpenFolder'
import { CanvasPage } from './components/canvas/CanvasPage'
import { installTestHook } from './testHook'

// Install E2E test hook in dev / test builds
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  installTestHook()
}

export default function App() {
  const rootPath     = useCanvasStore(s => s.rootPath)
  const setAdapter   = useCanvasStore(s => s.setAdapter)
  const fsMode       = useCanvasStore(s => s.fsMode)

  // Auto-connect when running in server mode (served by our Node server)
  useEffect(() => {
    if (fsMode === 'server' && rootPath === null) {
      detectServerRoot().then(root => {
        setAdapter(serverAdapter, root, 'server')
      })
    }
  }, [fsMode, rootPath, setAdapter])

  if (rootPath === null) return <OpenFolder />
  return <CanvasPage />
}
