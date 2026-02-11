import { useState, useCallback, useMemo } from 'react'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'
import type { KanbanBoardConfig, BoardColumn } from '@/lib/types'

type KanbanConfigStore = Record<string, KanbanBoardConfig>

function generateColumnId(): string {
  return crypto.randomUUID()
}

function getConfigStore(): KanbanConfigStore {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.KANBAN_CONFIG)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as KanbanConfigStore
  } catch {
    return {}
  }
}

function saveConfigStore(store: KanbanConfigStore): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.KANBAN_CONFIG, JSON.stringify(store))
}

function getDefaultConfig(sourceId: string): KanbanBoardConfig {
  return {
    sourceId,
    columns: [],
    defaultColumn: {
      name: 'Uncategorized',
      visible: true,
    },
  }
}

export function useKanbanConfig(sourceId: string) {
  const [configStore, setConfigStore] = useState<KanbanConfigStore>(getConfigStore)

  const config = useMemo(() => {
    return configStore[sourceId] ?? getDefaultConfig(sourceId)
  }, [configStore, sourceId])

  const updateConfig = useCallback(
    (updates: Partial<Omit<KanbanBoardConfig, 'sourceId'>>) => {
      setConfigStore((prev) => {
        const currentConfig = prev[sourceId] ?? getDefaultConfig(sourceId)
        const updated = {
          ...prev,
          [sourceId]: {
            ...currentConfig,
            ...updates,
          },
        }
        saveConfigStore(updated)
        return updated
      })
    },
    [sourceId]
  )

  const addColumn = useCallback(
    (tag: string, name?: string) => {
      const currentConfig = configStore[sourceId] ?? getDefaultConfig(sourceId)
      const newColumn: BoardColumn = {
        id: generateColumnId(),
        tag,
        name: name ?? tag,
        order: currentConfig.columns.length,
      }
      updateConfig({
        columns: [...currentConfig.columns, newColumn],
      })
      return newColumn
    },
    [configStore, sourceId, updateConfig]
  )

  const removeColumn = useCallback(
    (columnId: string) => {
      const currentConfig = configStore[sourceId] ?? getDefaultConfig(sourceId)
      const updatedColumns = currentConfig.columns
        .filter((col) => col.id !== columnId)
        .map((col, index) => ({ ...col, order: index }))
      updateConfig({
        columns: updatedColumns,
      })
    },
    [configStore, sourceId, updateConfig]
  )

  const reorderColumn = useCallback(
    (columnId: string, direction: 'up' | 'down') => {
      const currentConfig = configStore[sourceId] ?? getDefaultConfig(sourceId)
      const columns = [...currentConfig.columns]
      const index = columns.findIndex((col) => col.id === columnId)

      if (index === -1) return
      if (direction === 'up' && index === 0) return
      if (direction === 'down' && index === columns.length - 1) return

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      ;[columns[index], columns[targetIndex]] = [columns[targetIndex], columns[index]]

      const reorderedColumns = columns.map((col, idx) => ({ ...col, order: idx }))
      updateConfig({
        columns: reorderedColumns,
      })
    },
    [configStore, sourceId, updateConfig]
  )

  const updateDefaultColumn = useCallback(
    (updates: Partial<KanbanBoardConfig['defaultColumn']>) => {
      const currentConfig = configStore[sourceId] ?? getDefaultConfig(sourceId)
      updateConfig({
        defaultColumn: {
          ...currentConfig.defaultColumn,
          ...updates,
        },
      })
    },
    [configStore, sourceId, updateConfig]
  )

  return {
    config,
    updateConfig,
    addColumn,
    removeColumn,
    reorderColumn,
    updateDefaultColumn,
  }
}
