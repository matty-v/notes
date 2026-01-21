import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NoteForm } from '@/components/note-form'
import { NoteCard } from '@/components/note-card'
import { TagFilter } from '@/components/tag-filter'
import { SyncStatus } from '@/components/sync-status'
import { SettingsDialog } from '@/components/settings-dialog'
import { useNotes } from '@/hooks/use-notes'
import { useSettings } from '@/hooks/use-settings'
import type { SortOrder } from '@/lib/types'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const {
    spreadsheetId,
    connectSpreadsheet,
    isInitializing,
    status,
    anthropicApiKey,
    setAnthropicApiKey,
    clearAnthropicApiKey,
  } = useSettings()

  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes({
    search,
    tagFilter,
    sortOrder,
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: notes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
    getItemKey: (index) => notes[index]?.id ?? index,
  })

  return (
    <div className="h-screen flex flex-col max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notes</h1>
        <div className="flex items-center gap-2">
          <SyncStatus />
          <SettingsDialog
            spreadsheetId={spreadsheetId}
            onSave={connectSpreadsheet}
            isSaving={isInitializing}
            status={status}
            anthropicApiKey={anthropicApiKey}
            onSaveApiKey={setAnthropicApiKey}
            onClearApiKey={clearAnthropicApiKey}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <TagFilter selected={tagFilter} onChange={setTagFilter} />
      </div>

      <div className="mb-4">
        <NoteForm onSubmit={createNote} />
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search || tagFilter.length > 0
              ? 'No notes match your filters'
              : 'No notes yet. Create your first note above!'}
          </p>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="pb-3">
                  <NoteCard
                    note={notes[virtualRow.index]}
                    onUpdate={(data) => updateNote({ id: notes[virtualRow.index].id, ...data })}
                    onDelete={() => deleteNote(notes[virtualRow.index].id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
