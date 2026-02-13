import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useTags } from '@/hooks/use-tags'

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
  sourceId?: string
}

export function TagFilter({ selected, onChange, sourceId }: TagFilterProps) {
  const { tags, isLoading } = useTags(sourceId)

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-nowrap gap-1 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-lg flex-shrink-0" />
        ))}
      </div>
    )
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-nowrap gap-1 overflow-x-auto pb-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={cn(
            'px-3 py-1 text-xs rounded-lg border transition-all duration-300 whitespace-nowrap flex-shrink-0',
            selected.includes(tag)
              ? 'bg-[var(--accent-cyan)] text-[#0a0e14] border-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,212,255,0.3)]'
              : 'bg-[rgba(18,24,33,0.5)] text-muted-foreground border-[rgba(100,150,255,0.2)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
