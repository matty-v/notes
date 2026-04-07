import { Check, X, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface AISuggestionPanelProps {
  suggestion: { title: string; tags: string[] } | null
  isLoading: boolean
  error?: string | null
  currentTitle: string
  currentTags: string[]
  onAcceptTitle: (title: string) => void
  onAcceptTag: (tag: string) => void
  onAcceptAllTags: (tags: string[]) => void
  onDismiss: () => void
}

export function AISuggestionPanel({
  suggestion,
  isLoading,
  error,
  currentTitle,
  currentTags,
  onAcceptTitle,
  onAcceptTag,
  onAcceptAllTags,
  onDismiss,
}: AISuggestionPanelProps) {
  if (!isLoading && !suggestion && !error) return null

  if (error) {
    return (
      <div className="rounded-lg border border-[rgba(255,100,150,0.3)] bg-[rgba(255,100,150,0.05)] p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-[var(--accent-pink)] mt-0.5 flex-shrink-0" />
        <span className="text-sm text-[var(--accent-pink)] flex-1">{error}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0 flex-shrink-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] p-3 flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-sm text-[var(--accent-cyan)]">Generating suggestions...</span>
      </div>
    )
  }

  if (!suggestion) return null

  const titleIsSame = suggestion.title.trim().toLowerCase() === currentTitle.trim().toLowerCase()
  const currentTagsLower = currentTags.map((t) => t.toLowerCase())
  const newTags = suggestion.tags.filter((t) => !currentTagsLower.includes(t.toLowerCase()))
  const existingTags = suggestion.tags.filter((t) => currentTagsLower.includes(t.toLowerCase()))

  return (
    <div className="rounded-lg border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--accent-cyan)] uppercase tracking-wider">AI Suggestions</span>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Title suggestion */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Title</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm flex-1 ${titleIsSame ? 'text-muted-foreground' : 'text-foreground'}`}>
            {titleIsSame ? `"${suggestion.title}" (same as current)` : `"${suggestion.title}"`}
          </span>
          {!titleIsSame && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAcceptTitle(suggestion.title)}
              className="h-6 px-2 text-xs text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.1)]"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
          )}
        </div>
      </div>

      {/* Tag suggestions */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tags</span>
          {newTags.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAcceptAllTags(newTags)}
              className="h-5 px-2 text-xs text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.1)]"
            >
              Accept all new
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {existingTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-md bg-[rgba(100,150,255,0.05)] border border-[rgba(100,150,255,0.1)] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {newTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onAcceptTag(tag)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.2)] transition-colors"
            >
              <Plus className="h-3 w-3" />
              {tag}
            </button>
          ))}
          {newTags.length === 0 && existingTags.length > 0 && (
            <span className="text-xs text-muted-foreground italic">No new tags suggested</span>
          )}
        </div>
      </div>
    </div>
  )
}
