import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanNoteCard } from '@/components/kanban-note-card'
import type { Note } from '@/lib/types'

interface KanbanColumnProps {
  id: string
  title: string
  notes: Note[]
  onNoteClick: (note: Note) => void
  isDefaultColumn?: boolean
}

export function KanbanColumn({ id, title, notes, onNoteClick, isDefaultColumn = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  const noteIds = notes.map((note) => note.id)

  return (
    <div className="flex flex-col w-[320px] h-full flex-shrink-0">
      {/* Column Header */}
      <div className="sticky top-0 z-10 px-4 py-3 mb-3 rounded-lg bg-[rgba(18,24,33,0.8)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_20px_rgba(0,212,255,0.05)]">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground text-sm">
            {title}
          </h3>
          <span className="px-2 py-0.5 text-xs rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]">
            {notes.length}
          </span>
        </div>
        {isDefaultColumn && (
          <p className="mt-1 text-xs text-muted-foreground">
            Notes without configured tags
          </p>
        )}
      </div>

      {/* Column Content - Scrollable and Droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto px-2 space-y-3 transition-colors ${
          isOver ? 'bg-[rgba(0,212,255,0.05)]' : ''
        }`}
      >
        {notes.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground font-light">
              {isDefaultColumn ? 'No uncategorized notes' : `No notes with "${title}" tag`}
            </p>
          </div>
        ) : (
          <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
            {notes.map((note) => (
              <KanbanNoteCard
                key={note.id}
                note={note}
                onOpenModal={() => onNoteClick(note)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
