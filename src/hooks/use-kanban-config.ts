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
      const newColumn: BoardColumn = {
        id: generateColumnId(),
        tag,
        name: name ?? tag,
        order: 0, // Will be updated below
      }

      setConfigStore((prev) => {
        const currentConfig = prev[sourceId] ?? getDefaultConfig(sourceId)
        newColumn.order = currentConfig.columns.length
        const updated = {
          ...prev,
          [sourceId]: {
            ...currentConfig,
            columns: [...currentConfig.columns, newColumn],
          },
        }
        saveConfigStore(updated)
        return updated
      })

      return newColumn
    },
    [sourceId]
  )

  const removeColumn = useCallback(
    (columnId: string) => {
      setConfigStore((prev) => {
        const currentConfig = prev[sourceId] ?? getDefaultConfig(sourceId)
        const updatedColumns = currentConfig.columns
          .filter((col) => col.id !== columnId)
          .map((col, index) => ({ ...col, order: index }))
        const updated = {
          ...prev,
          [sourceId]: {
            ...currentConfig,
            columns: updatedColumns,
          },
        }
        saveConfigStore(updated)
        return updated
      })
    },
    [sourceId]
  )

  const reorderColumn = useCallback(
    (columnId: string, direction: 'up' | 'down') => {
      setConfigStore((prev) => {
        const currentConfig = prev[sourceId] ?? getDefaultConfig(sourceId)
        const columns = [...currentConfig.columns]
        const index = columns.findIndex((col) => col.id === columnId)

        if (index === -1) return prev
        if (direction === 'up' && index === 0) return prev
        if (direction === 'down' && index === columns.length - 1) return prev

        const targetIndex = direction === 'up' ? index - 1 : index + 1
        ;[columns[index], columns[targetIndex]] = [columns[targetIndex], columns[index]]

        const reorderedColumns = columns.map((col, idx) => ({ ...col, order: idx }))
        const updated = {
          ...prev,
          [sourceId]: {
            ...currentConfig,
            columns: reorderedColumns,
          },
        }
        saveConfigStore(updated)
        return updated
      })
    },
    [sourceId]
  )

  const updateDefaultColumn = useCallback(
    (updates: Partial<KanbanBoardConfig['defaultColumn']>) => {
      setConfigStore((prev) => {
        const currentConfig = prev[sourceId] ?? getDefaultConfig(sourceId)
        const updated = {
          ...prev,
          [sourceId]: {
            ...currentConfig,
            defaultColumn: {
              ...currentConfig.defaultColumn,
              ...updates,
            },
          },
        }
        saveConfigStore(updated)
        return updated
      })
    },
    [sourceId]
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
