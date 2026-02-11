import { useState, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'
import { renderMarkdown } from '@/lib/markdown'
import type { Note } from '@/lib/types'

interface NoteModalProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (data: { title: string; content: string; tags: string }) => Promise<unknown>
  onDelete: () => Promise<unknown>
}


export function NoteModal({ note, open, onOpenChange, onUpdate, onDelete }: NoteModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset editing state when modal closes to avoid state persisting across notes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setIsDeleting(false)
    }
  }, [open])

  if (!note) return null

  const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdate = async (data: { title: string; content: string; tags: string }) => {
    await onUpdate(data)
    setIsEditing(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {isEditing ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <NoteForm
                initialValues={{
                  title: note.title,
                  content: note.content,
                  tags,
                }}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                submitLabel="Update"
              />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 text-left">
                  <DialogTitle className="text-2xl">{note.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground font-light mt-1">{date}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {note.content && renderMarkdown(note.content)}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
