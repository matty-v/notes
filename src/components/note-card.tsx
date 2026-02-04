import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'
import { linkify } from '@/lib/linkify'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onUpdate: (data: { title: string; content: string; tags: string }) => Promise<unknown>
  onDelete: () => Promise<unknown>
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)

  const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  // Check if content is truncated
  useEffect(() => {
    if (contentRef.current && note.content) {
      const element = contentRef.current
      const isContentTruncated = element.scrollHeight > element.clientHeight
      setIsTruncated(isContentTruncated)
    }
  }, [note.content])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExpanded = () => {
    if (isTruncated || isExpanded) {
      setIsExpanded(!isExpanded)
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
        <div
          onClick={toggleExpanded}
          className={`mt-2 ${isTruncated || isExpanded ? 'cursor-pointer' : ''}`}
          role={isTruncated || isExpanded ? 'button' : undefined}
          tabIndex={isTruncated || isExpanded ? 0 : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && (isTruncated || isExpanded)) {
              e.preventDefault()
              toggleExpanded()
            }
          }}
        >
          <p
            ref={contentRef}
            className={`text-sm text-muted-foreground font-light transition-all duration-300 ${
              isExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {linkify(note.content)}
          </p>
          {(isTruncated || isExpanded) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  <span>Show more</span>
                </>
              )}
            </div>
          )}
        </div>
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
