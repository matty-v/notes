import { X } from 'lucide-react'

interface FilterChipStripProps {
  tagFilter: string[]
  onRemoveTag: (tag: string) => void
  onClearAll: () => void
}

export function FilterChipStrip({ tagFilter, onRemoveTag, onClearAll }: FilterChipStripProps) {
  if (tagFilter.length === 0) return null

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-nowrap">
      {tagFilter.length >= 2 && (
        <span className="text-xs text-muted-foreground flex-shrink-0">any of:</span>
      )}
      {tagFilter.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] text-[var(--accent-cyan)] flex-shrink-0"
        >
          {tag}
          <button
            onClick={() => onRemoveTag(tag)}
            aria-label={`Remove ${tag}`}
            className="inline-flex items-center justify-center hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="px-2 py-0.5 text-xs rounded-md border border-[rgba(100,150,255,0.2)] text-muted-foreground hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)] transition-all flex-shrink-0"
      >
        Clear all
      </button>
    </div>
  )
}
