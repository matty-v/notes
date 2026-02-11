import { renderMarkdown } from '@/lib/markdown'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onOpenModal: () => void
  variant?: 'list' | 'grid'
}

export function NoteCard({ note, onOpenModal, variant = 'list' }: NoteCardProps) {
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
        <div className={`mt-2 ${contentClamp} overflow-hidden prose prose-invert max-w-none [&]:text-xs [&_p]:mb-1 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0`}>
          {renderMarkdown(note.content)}
        </div>
      )}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
