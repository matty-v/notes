import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { NoteCard } from '@/components/note-card'
import type { Note } from '@/lib/types'

interface KanbanNoteCardProps {
  note: Note
  onOpenModal: () => void
}

export function KanbanNoteCard({ note, onOpenModal }: KanbanNoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 bg-[rgba(18,24,33,0.9)] border border-[rgba(100,150,255,0.3)] cursor-grab active:cursor-grabbing transition-opacity"
        title="Drag to move"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Note Card - Clickable */}
      <NoteCard
        note={note}
        variant="grid"
        onOpenModal={onOpenModal}
      />
    </div>
  )
}
