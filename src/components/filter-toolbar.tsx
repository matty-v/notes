import { useState } from 'react'
import { Search, Tag, ArrowUpDown, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useTags } from '@/hooks/use-tags'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/lib/types'

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'alphabetical', label: 'Alphabetical' },
]

const SORT_SHORT_LABELS: Record<SortOrder, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  alphabetical: 'Alphabetical',
}

interface FilterToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  tagFilter: string[]
  onTagFilterChange: (tags: string[]) => void
  sortOrder: SortOrder
  onSortChange: (order: SortOrder) => void
  sourceId?: string
}

export function FilterToolbar({
  search,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  sortOrder,
  onSortChange,
  sourceId,
}: FilterToolbarProps) {
  const { tags, tagCounts } = useTags(sourceId)
  const [tagSearch, setTagSearch] = useState('')
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [sortPickerOpen, setSortPickerOpen] = useState(false)

  const filteredTags = tagSearch.trim()
    ? tags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : tags

  const toggleTag = (tag: string) => {
    if (tagFilter.includes(tag)) {
      onTagFilterChange(tagFilter.filter((t) => t !== tag))
    } else {
      onTagFilterChange([...tagFilter, tag])
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tags picker */}
      <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
        <PopoverTrigger asChild>
          <button
            title="Filters notes with any selected tag"
            aria-label={tagFilter.length > 0 ? `Tags (${tagFilter.length} active)` : 'Tags'}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-10 text-sm rounded-md border transition-all duration-200 flex-shrink-0',
              tagFilter.length > 0
                ? 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.4)] text-[var(--accent-cyan)]'
                : 'bg-transparent border-[rgba(100,150,255,0.2)] text-muted-foreground hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]'
            )}
          >
            <Tag className="h-4 w-4" />
            <span>Tags</span>
            {tagFilter.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[var(--accent-cyan)] text-[#0a0e14] text-xs font-semibold leading-none">
                {tagFilter.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 max-h-80 flex flex-col p-0">
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">No tags found</p>
          ) : (
            <>
              {tags.length > 10 && (
                <div className="p-2 border-b border-[rgba(100,150,255,0.1)]">
                  <input
                    type="text"
                    placeholder="Filter tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full h-7 px-2 text-xs rounded-md bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-foreground focus:outline-none focus:border-[var(--accent-cyan)] placeholder:text-muted-foreground"
                  />
                </div>
              )}
              <div className="overflow-y-auto flex-1 p-1">
                {filteredTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No matching tags</p>
                ) : (
                  filteredTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors',
                        tagFilter.includes(tag)
                          ? 'bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)]'
                          : 'text-muted-foreground hover:bg-[rgba(100,150,255,0.1)] hover:text-foreground'
                      )}
                    >
                      <span>{tag}</span>
                      <span className="flex items-center gap-1">
                        <span className="opacity-50">{tagCounts[tag]}</span>
                        {tagFilter.includes(tag) && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Sort picker */}
      <Popover open={sortPickerOpen} onOpenChange={setSortPickerOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label={`Sort: ${SORT_SHORT_LABELS[sortOrder]}`}
            className="inline-flex items-center gap-1.5 px-3 h-10 text-sm rounded-md border border-[rgba(100,150,255,0.2)] text-muted-foreground hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all duration-200 flex-shrink-0 bg-transparent"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{SORT_SHORT_LABELS[sortOrder]}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSortChange(opt.value)
                setSortPickerOpen(false)
              }}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors',
                sortOrder === opt.value
                  ? 'bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)]'
                  : 'text-muted-foreground hover:bg-[rgba(100,150,255,0.1)] hover:text-foreground'
              )}
            >
              {opt.label}
              {sortOrder === opt.value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
