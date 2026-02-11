import { describe, it, expect } from 'vitest'
import type { Note, KanbanBoardConfig } from '@/lib/types'

// Extract the organization logic for testing
function organizeNotesIntoColumns(
  notes: Note[],
  config: KanbanBoardConfig
): Map<string, Note[]> {
  const columnMap = new Map<string, Note[]>()

  config.columns.forEach(col => columnMap.set(col.id, []))

  if (config.defaultColumn.visible) {
    columnMap.set('__default__', [])
  }

  const columnTags = new Set(config.columns.map(col => col.tag))

  for (const note of notes) {
    const noteTags = note.tags.split(',').map(t => t.trim()).filter(Boolean)

    let assigned = false
    for (const column of [...config.columns].sort((a, b) => a.order - b.order)) {
      if (noteTags.includes(column.tag)) {
        columnMap.get(column.id)!.push(note)
        assigned = true
        break
      }
    }

    if (!assigned && config.defaultColumn.visible) {
      const hasColumnTag = noteTags.some(tag => columnTags.has(tag))
      if (!hasColumnTag) {
        columnMap.get('__default__')!.push(note)
      }
    }
  }

  return columnMap
}

const createNote = (id: string, tags: string): Note => ({
  id,
  sourceId: 'test-source',
  title: `Note ${id}`,
  content: 'Test content',
  tags,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('Kanban Note Organization', () => {
  it('should organize notes into correct columns based on tags', () => {
    const notes: Note[] = [
      createNote('1', 'todo, important'),
      createNote('2', 'doing'),
      createNote('3', 'done, reviewed'),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
        { id: 'col2', tag: 'doing', name: 'Doing', order: 1 },
        { id: 'col3', tag: 'done', name: 'Done', order: 2 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: true },
    }

    const result = organizeNotesIntoColumns(notes, config)

    expect(result.get('col1')).toHaveLength(1)
    expect(result.get('col1')?.[0].id).toBe('1')
    expect(result.get('col2')).toHaveLength(1)
    expect(result.get('col2')?.[0].id).toBe('2')
    expect(result.get('col3')).toHaveLength(1)
    expect(result.get('col3')?.[0].id).toBe('3')
  })

  it('should use first matching column rule for notes with multiple column tags', () => {
    const notes: Note[] = [
      createNote('1', 'todo, doing, done'),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
        { id: 'col2', tag: 'doing', name: 'Doing', order: 1 },
        { id: 'col3', tag: 'done', name: 'Done', order: 2 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: true },
    }

    const result = organizeNotesIntoColumns(notes, config)

    // Should appear in 'todo' column only (first match by order)
    expect(result.get('col1')).toHaveLength(1)
    expect(result.get('col2')).toHaveLength(0)
    expect(result.get('col3')).toHaveLength(0)
  })

  it('should place notes without column tags in default column', () => {
    const notes: Note[] = [
      createNote('1', 'urgent, important'),
      createNote('2', 'work'),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: true },
    }

    const result = organizeNotesIntoColumns(notes, config)

    expect(result.get('col1')).toHaveLength(0)
    expect(result.get('__default__')).toHaveLength(2)
  })

  it('should not show notes without column tags when default column is hidden', () => {
    const notes: Note[] = [
      createNote('1', 'urgent, important'),
      createNote('2', 'todo'),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: false },
    }

    const result = organizeNotesIntoColumns(notes, config)

    expect(result.get('col1')).toHaveLength(1)
    expect(result.has('__default__')).toBe(false)
  })

  it('should respect column order when matching tags', () => {
    const notes: Note[] = [
      createNote('1', 'todo, urgent'),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'urgent', name: 'Urgent', order: 0 },
        { id: 'col2', tag: 'todo', name: 'To Do', order: 1 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: true },
    }

    const result = organizeNotesIntoColumns(notes, config)

    // Should match 'urgent' first (lower order)
    expect(result.get('col1')).toHaveLength(1)
    expect(result.get('col2')).toHaveLength(0)
  })

  it('should handle notes with empty tags', () => {
    const notes: Note[] = [
      createNote('1', ''),
      createNote('2', '   '),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: true },
    }

    const result = organizeNotesIntoColumns(notes, config)

    expect(result.get('__default__')).toHaveLength(2)
  })

  it('should handle mixed non-column and column tags correctly', () => {
    const notes: Note[] = [
      createNote('1', 'urgent, todo, important'),
      createNote('2', 'urgent, important'),
    ]

    const config: KanbanBoardConfig = {
      sourceId: 'test',
      columns: [
        { id: 'col1', tag: 'todo', name: 'To Do', order: 0 },
      ],
      defaultColumn: { name: 'Uncategorized', visible: true },
    }

    const result = organizeNotesIntoColumns(notes, config)

    // Note 1 has 'todo' tag, should go to col1
    expect(result.get('col1')).toHaveLength(1)
    expect(result.get('col1')?.[0].id).toBe('1')

    // Note 2 doesn't have 'todo' tag, should go to default
    expect(result.get('__default__')).toHaveLength(1)
    expect(result.get('__default__')?.[0].id).toBe('2')
  })
})
