import { useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanColumn } from '@/components/kanban-column'
import type { Note, KanbanBoardConfig } from '@/lib/types'

interface KanbanBoardViewProps {
  notes: Note[]
  config: KanbanBoardConfig
  onNoteClick: (note: Note) => void
  onOpenConfig: () => void
  onUpdateNote: (noteId: string, tags: string) => void
  isLoading?: boolean
}

function organizeNotesIntoColumns(
  notes: Note[],
  config: KanbanBoardConfig
): Map<string, Note[]> {
  const columnMap = new Map<string, Note[]>()

  // Initialize all configured columns
  config.columns.forEach(col => columnMap.set(col.id, []))

  // Initialize default column if visible
  if (config.defaultColumn.visible) {
    columnMap.set('__default__', [])
  }

  // Get all column tags for quick lookup
  const columnTags = new Set(config.columns.map(col => col.tag))

  for (const note of notes) {
    const noteTags = note.tags.split(',').map(t => t.trim()).filter(Boolean)

    // Find first matching column by order
    let assigned = false
    for (const column of [...config.columns].sort((a, b) => a.order - b.order)) {
      if (noteTags.includes(column.tag)) {
        columnMap.get(column.id)!.push(note)
        assigned = true
        break
      }
    }

    // If no match and default column visible, check if note has any column tags
    // If it doesn't have any column tags, add to default
    if (!assigned && config.defaultColumn.visible) {
      const hasColumnTag = noteTags.some(tag => columnTags.has(tag))
      if (!hasColumnTag) {
        columnMap.get('__default__')!.push(note)
      }
    }
  }

  return columnMap
}

export function KanbanBoardView({ notes, config, onNoteClick, onOpenConfig, onUpdateNote, isLoading = false }: KanbanBoardViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const organizedNotes = useMemo(
    () => organizeNotesIntoColumns(notes, config),
    [notes, config]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Find the note being dragged
    const note = notes.find((n) => n.id === active.id)
    if (!note) return

    // Find the target column
    const targetColumnId = over.id as string

    // Get current note tags
    const currentTags = note.tags.split(',').map(t => t.trim()).filter(Boolean)

    // Get all column tags for filtering
    const columnTags = new Set(config.columns.map(col => col.tag))

    // Remove all column tags from current tags (preserve non-column tags)
    const nonColumnTags = currentTags.filter(tag => !columnTags.has(tag))

    let newTags: string[]

    if (targetColumnId === '__default__') {
      // Moving to default column - only keep non-column tags
      newTags = nonColumnTags
    } else {
      // Moving to a specific column
      const targetColumn = config.columns.find(col => col.id === targetColumnId)
      if (!targetColumn) return

      // Add target column tag to non-column tags
      newTags = [...nonColumnTags, targetColumn.tag]
    }

    // Update the note with new tags
    const newTagsString = newTags.join(', ')
    onUpdateNote(note.id, newTagsString)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-center text-muted-foreground font-light">Loading...</p>
      </div>
    )
  }

  const hasColumns = config.columns.length > 0 || config.defaultColumn.visible

  if (!hasColumns) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Board Columns Configured
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Configure your Kanban board by selecting tags to use as columns.
            You can drag notes between columns to organize your workflow.
          </p>
          <Button onClick={onOpenConfig} size="lg">
            <Settings className="h-4 w-4 mr-2" />
            Configure Board
          </Button>
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <p className="text-muted-foreground font-light">
            No notes to display. Create your first note to get started!
          </p>
        </div>
      </div>
    )
  }

  // Build ordered list of columns to render
  const columnsToRender: Array<{ id: string; title: string; notes: Note[]; isDefault: boolean }> = []

  // Add configured columns in order
  const sortedColumns = [...config.columns].sort((a, b) => a.order - b.order)
  for (const column of sortedColumns) {
    columnsToRender.push({
      id: column.id,
      title: column.name,
      notes: organizedNotes.get(column.id) || [],
      isDefault: false,
    })
  }

  // Add default column at the end if visible
  if (config.defaultColumn.visible) {
    columnsToRender.push({
      id: '__default__',
      title: config.defaultColumn.name,
      notes: organizedNotes.get('__default__') || [],
      isDefault: true,
    })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-2">
          {columnsToRender.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              notes={column.notes}
              onNoteClick={onNoteClick}
              isDefaultColumn={column.isDefault}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {null}
      </DragOverlay>
    </DndContext>
  )
}
