import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKanbanConfig } from '@/hooks/use-kanban-config'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'

describe('useKanbanConfig', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with default config for new source', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    expect(result.current.config).toEqual({
      sourceId: 'source1',
      columns: [],
      defaultColumn: {
        name: 'Uncategorized',
        visible: true,
      },
    })
  })

  it('should add column correctly', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    act(() => {
      result.current.addColumn('todo', 'To Do')
    })

    expect(result.current.config.columns).toHaveLength(1)
    expect(result.current.config.columns[0]).toMatchObject({
      tag: 'todo',
      name: 'To Do',
      order: 0,
    })
    expect(result.current.config.columns[0].id).toBeDefined()
  })

  it('should remove column correctly', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    let columnId: string

    act(() => {
      const column = result.current.addColumn('todo', 'To Do')
      columnId = column.id
    })

    expect(result.current.config.columns).toHaveLength(1)

    act(() => {
      result.current.removeColumn(columnId)
    })

    expect(result.current.config.columns).toHaveLength(0)
  })

  it('should reorder columns correctly', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    let col2Id: string

    act(() => {
      result.current.addColumn('todo', 'To Do')
    })

    act(() => {
      col2Id = result.current.addColumn('doing', 'Doing').id
    })

    // Initial order
    expect(result.current.config.columns[0].tag).toBe('todo')
    expect(result.current.config.columns[1].tag).toBe('doing')

    act(() => {
      result.current.reorderColumn(col2Id, 'up')
    })

    // After moving 'doing' up, it should be first
    expect(result.current.config.columns[0].tag).toBe('doing')
    expect(result.current.config.columns[0].order).toBe(0)
    expect(result.current.config.columns[1].tag).toBe('todo')
    expect(result.current.config.columns[1].order).toBe(1)
  })

  it('should not reorder column at start when moving up', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    act(() => {
      result.current.addColumn('todo', 'To Do')
      result.current.addColumn('doing', 'Doing')
    })

    const initialColumns = [...result.current.config.columns]
    const firstColumnId = result.current.config.columns[0].id

    act(() => {
      result.current.reorderColumn(firstColumnId, 'up')
    })

    expect(result.current.config.columns).toEqual(initialColumns)
  })

  it('should not reorder column at end when moving down', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    let col2Id: string

    act(() => {
      result.current.addColumn('todo', 'To Do')
      col2Id = result.current.addColumn('doing', 'Doing').id
    })

    const initialColumns = [...result.current.config.columns]

    act(() => {
      result.current.reorderColumn(col2Id, 'down')
    })

    expect(result.current.config.columns).toEqual(initialColumns)
  })

  it('should update default column settings', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    act(() => {
      result.current.updateDefaultColumn({ visible: false })
    })

    expect(result.current.config.defaultColumn.visible).toBe(false)

    act(() => {
      result.current.updateDefaultColumn({ name: 'Backlog' })
    })

    expect(result.current.config.defaultColumn.name).toBe('Backlog')
    expect(result.current.config.defaultColumn.visible).toBe(false)
  })

  it('should persist config to localStorage', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    act(() => {
      result.current.addColumn('todo', 'To Do')
    })

    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.KANBAN_CONFIG)
    expect(stored).toBeDefined()

    const parsed = JSON.parse(stored!)
    expect(parsed.source1).toBeDefined()
    expect(parsed.source1.columns).toHaveLength(1)
  })

  it('should maintain separate configs per source', () => {
    const { result: result1 } = renderHook(() => useKanbanConfig('source1'))
    const { result: result2 } = renderHook(() => useKanbanConfig('source2'))

    act(() => {
      result1.current.addColumn('todo', 'To Do')
    })

    act(() => {
      result2.current.addColumn('task', 'Task')
    })

    expect(result1.current.config.columns).toHaveLength(1)
    expect(result1.current.config.columns[0].tag).toBe('todo')

    expect(result2.current.config.columns).toHaveLength(1)
    expect(result2.current.config.columns[0].tag).toBe('task')
  })

  it('should load config from localStorage on mount', () => {
    // Set up initial config
    const initialConfig = {
      source1: {
        sourceId: 'source1',
        columns: [
          { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
        ],
        defaultColumn: {
          name: 'Uncategorized',
          visible: true,
        },
      },
    }

    localStorage.setItem(
      LOCAL_STORAGE_KEYS.KANBAN_CONFIG,
      JSON.stringify(initialConfig)
    )

    const { result } = renderHook(() => useKanbanConfig('source1'))

    expect(result.current.config.columns).toHaveLength(1)
    expect(result.current.config.columns[0].tag).toBe('todo')
  })

  it('should use tag name as display name when custom name not provided', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    act(() => {
      result.current.addColumn('todo')
    })

    expect(result.current.config.columns[0].name).toBe('todo')
  })

  it('should maintain order values when removing columns', () => {
    const { result } = renderHook(() => useKanbanConfig('source1'))

    let col1Id: string

    act(() => {
      col1Id = result.current.addColumn('todo', 'To Do').id
    })

    act(() => {
      result.current.addColumn('doing', 'Doing')
    })

    act(() => {
      result.current.addColumn('done', 'Done')
    })

    expect(result.current.config.columns).toHaveLength(3)

    act(() => {
      result.current.removeColumn(col1Id)
    })

    expect(result.current.config.columns).toHaveLength(2)
    expect(result.current.config.columns[0].tag).toBe('doing')
    expect(result.current.config.columns[0].order).toBe(0)
    expect(result.current.config.columns[1].tag).toBe('done')
    expect(result.current.config.columns[1].order).toBe(1)
  })
})
