import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanColumn } from '@/components/kanban-column'
import { KanbanColumnSkeleton } from '@/components/kanban-column-skeleton'
import { KanbanNoteCard } from '@/components/kanban-note-card'
import { organizeNotesIntoColumns } from '@/lib/kanban'
import type { Note, KanbanBoardConfig } from '@/lib/types'

interface KanbanBoardViewProps {
  notes: Note[]
  config: KanbanBoardConfig
  onNoteClick: (note: Note) => void
  onOpenConfig: () => void
  onUpdateNote: (noteId: string, tags: string) => void
  onAddNote: (tag: string) => void
  isLoading?: boolean
}

export function KanbanBoardView({ notes, config, onNoteClick, onOpenConfig, onUpdateNote, onAddNote, isLoading = false }: KanbanBoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

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

  // Set of all column IDs for quick lookup
  const columnIds = useMemo(() => {
    const ids = new Set<string>(config.columns.map(col => col.id))
    if (config.defaultColumn.visible) ids.add('__default__')
    return ids
  }, [config])

  // Custom collision detection: prefer column droppables over note sortables
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const collisions = pointerWithin(args)
    // Prefer column-level collisions over note-level ones
    const columnCollision = collisions.find(c => columnIds.has(c.id as string))
    return columnCollision ? [columnCollision] : collisions
  }, [columnIds])

  const draggedNote = activeId ? notes.find(n => n.id === activeId) : null

  // Resolve the column ID from any droppable (column or note inside column)
  const resolveColumnId = useCallback((droppableId: string | number, data?: Record<string, unknown>): string | undefined => {
    const id = String(droppableId)
    if (columnIds.has(id)) return id
    // It's a note ID — check sortable containerId, then search
    const containerId = (data as { sortable?: { containerId?: string } })?.sortable?.containerId
    if (containerId && columnIds.has(containerId)) return containerId
    for (const [colId, colNotes] of organizedNotes.entries()) {
      if (colNotes.some(n => n.id === id)) return colId
    }
    return undefined
  }, [columnIds, organizedNotes])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) {
      setOverColumnId(null)
      return
    }
    setOverColumnId(resolveColumnId(over.id, over.data.current) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumnId(null)

    if (!over || active.id === over.id) return

    // Find the note being dragged
    const note = notes.find((n) => n.id === active.id)
    if (!note) return

    const targetColumnId = resolveColumnId(over.id, over.data.current)
    if (!targetColumnId) return

    // Get current note tags
    const currentTags = (note.tags || '').split(',').map(t => t.trim()).filter(Boolean)

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

    // Update the note with new tags. Use `", "` (with space) as the canonical
    // joiner — same as note-form — so the on-disk representation is
    // consistent regardless of which path wrote the row, and the value is
    // human-readable when viewing the sheet directly.
    const newTagsString = newTags.join(', ')
    onUpdateNote(note.id, newTagsString)
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <KanbanColumnSkeleton key={i} />
          ))}
        </div>
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
  const columnsToRender: Array<{ id: string; title: string; tag?: string; notes: Note[]; isDefault: boolean }> = []

  // Add configured columns in order
  const sortedColumns = [...config.columns].sort((a, b) => a.order - b.order)
  for (const column of sortedColumns) {
    columnsToRender.push({
      id: column.id,
      title: column.name,
      tag: column.tag,
      notes: organizedNotes.get(column.id) || [],
      isDefault: false,
    })
  }

  // Add default column at the end if visible
  if (config.defaultColumn.visible) {
    columnsToRender.push({
      id: '__default__',
      title: config.defaultColumn.name,
      tag: '',
      notes: organizedNotes.get('__default__') || [],
      isDefault: true,
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-2">
          {columnsToRender.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tag={column.tag || ''}
              notes={column.notes}
              onNoteClick={onNoteClick}
              onAddNote={column.isDefault ? () => {} : () => onAddNote(column.tag || '')}
              isDefaultColumn={column.isDefault}
              isOver={overColumnId === column.id}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeId && draggedNote ? (
          <div className="w-[296px] opacity-80 rotate-[2deg] ring-2 ring-[rgba(0,212,255,0.5)] rounded-lg shadow-[0_0_24px_rgba(0,212,255,0.2)]">
            <KanbanNoteCard note={draggedNote} onOpenModal={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
