import { useState, useCallback } from 'react'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'
import type { ViewMode } from '@/lib/types'

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.VIEW_MODE)
    if (stored === 'list' || stored === 'grid' || stored === 'kanban') {
      return stored
    }
    return 'list'
  })

  const setViewMode = useCallback((mode: ViewMode) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, mode)
    setViewModeState(mode)
  }, [])

  return { viewMode, setViewMode }
}
