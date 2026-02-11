import { Button } from '@/components/ui/button'
import { linkify } from '@/lib/linkify'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onOpenModal: () => void
  onDelete: () => Promise<unknown>
  variant?: 'list' | 'grid'
}

export function NoteCard({ note, onOpenModal, onDelete, variant = 'list' }: NoteCardProps) {
  const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  const isGrid = variant === 'grid'
  const cardPadding = isGrid ? 'p-3' : 'p-4'
  const titleSize = isGrid ? 'text-sm' : 'font-medium'
  const contentSize = isGrid ? 'text-xs' : 'text-sm'
  const contentClamp = isGrid ? 'line-clamp-2' : 'line-clamp-3'
  const minHeight = isGrid ? 'min-h-[200px]' : ''

  return (
    <div
      onClick={onOpenModal}
      className={`${cardPadding} rounded-xl bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-[rgba(167,139,250,0.4)] hover:shadow-[0_0_60px_rgba(167,139,250,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] ${minHeight} flex flex-col cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-medium text-foreground ${titleSize}`}>{note.title}</h3>
        <span className="text-xs text-muted-foreground whitespace-nowrap font-light">{date}</span>
      </div>
      {note.content && (
        <p className={`mt-2 ${contentSize} text-muted-foreground font-light ${contentClamp}`}>
          {linkify(note.content)}
        </p>
      )}
      <div className={`mt-3 flex ${isGrid ? 'flex-col gap-2' : 'items-center justify-between'}`}>
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
            onClick={(e) => {
              e.stopPropagation()
              onOpenModal()
            }}
            className="hover:text-[var(--accent-cyan)]"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="hover:text-[var(--accent-pink)] hover:bg-[rgba(236,72,153,0.1)]"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
