import { cn } from '@/lib/utils'
import { useTags } from '@/hooks/use-tags'

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagFilter({ selected, onChange }: TagFilterProps) {
  const { tags } = useTags()

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  if (tags.length === 0) return null

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={cn(
            'px-2 py-1 text-xs rounded-full border transition-colors',
            selected.includes(tag)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
