import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onUpdate: (data: { title: string; content: string; tags: string }) => Promise<unknown>
  onDelete: () => Promise<unknown>
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <NoteForm
        initialValues={{
          title: note.title,
          content: note.content,
          tags,
        }}
        onSubmit={async (data) => {
          await onUpdate(data)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
        submitLabel="Update"
      />
    )
  }

  return (
    <div className="p-4 rounded-xl bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-[rgba(167,139,250,0.4)] hover:shadow-[0_0_60px_rgba(167,139,250,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground">{note.title}</h3>
        <span className="text-sm text-muted-foreground whitespace-nowrap font-light">{date}</span>
      </div>
      {note.content && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 font-light">{note.content}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="hover:text-[var(--accent-cyan)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:text-[var(--accent-pink)] hover:bg-[rgba(236,72,153,0.1)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
