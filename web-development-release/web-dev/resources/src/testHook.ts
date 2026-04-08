// testHook.ts — exported utilities for automated tests (Playwright / Vitest)
// Exposes the Zustand store instance on window.__archui for E2E test access.

import { useCanvasStore } from './store/canvas'

declare global {
  interface Window {
    __archui?: {
      getStore: typeof useCanvasStore.getState
    }
  }
}

export function installTestHook(): void {
  if (typeof window !== 'undefined') {
    window.__archui = { getStore: useCanvasStore.getState }
  }
}
