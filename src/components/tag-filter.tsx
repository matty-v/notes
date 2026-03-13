import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useTags } from '@/hooks/use-tags'

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
  sourceId?: string
}

const COLLAPSED_LIMIT = 10

export function TagFilter({ selected, onChange, sourceId }: TagFilterProps) {
  const { tags, tagCounts, isLoading } = useTags(sourceId)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

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

  const showSearch = tags.length > COLLAPSED_LIMIT
  const isSearching = searchQuery.trim().length > 0

  // Filter tags by search query
  const filteredTags = isSearching
    ? tags.filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : tags

  // When collapsed (not searching, not expanded): show top N + any selected outside top N
  const visibleTags = (() => {
    if (isSearching || isExpanded) return filteredTags
    const topTags = filteredTags.slice(0, COLLAPSED_LIMIT)
    const selectedOutsideTop = selected.filter(
      (t) => filteredTags.includes(t) && !topTags.includes(t)
    )
    return [...topTags, ...selectedOutsideTop]
  })()

  const hiddenCount = filteredTags.length - COLLAPSED_LIMIT
  const showToggle = !isSearching && filteredTags.length > COLLAPSED_LIMIT

  return (
    <div className="space-y-2">
      {showSearch && (
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-6 pl-6 pr-2 text-xs rounded-md bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-foreground focus:outline-none focus:border-[var(--accent-cyan)] placeholder:text-muted-foreground transition-all duration-300"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {visibleTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              'px-3 py-1 text-xs rounded-lg border transition-all duration-300 whitespace-nowrap',
              selected.includes(tag)
                ? 'bg-[var(--accent-cyan)] text-[#0a0e14] border-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                : 'bg-[rgba(18,24,33,0.5)] text-muted-foreground border-[rgba(100,150,255,0.2)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]'
            )}
          >
            {tag}
            <span className="ml-1 opacity-60">{tagCounts[tag]}</span>
          </button>
        ))}
        {showToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-xs rounded-lg border border-[rgba(100,150,255,0.15)] text-muted-foreground hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)] transition-all duration-300 whitespace-nowrap"
          >
            {isExpanded ? 'Show less' : `Show all (${hiddenCount} more)`}
          </button>
        )}
      </div>
    </div>
  )
}
