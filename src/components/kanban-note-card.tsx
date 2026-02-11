import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <NoteCard
        note={note}
        variant="grid"
        onOpenModal={onOpenModal}
      />
    </div>
  )
}
