import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NoteForm } from '@/components/note-form'
import { NoteCard } from '@/components/note-card'
import { NoteModal } from '@/components/note-modal'
import { TagFilter } from '@/components/tag-filter'
import { SyncStatus } from '@/components/sync-status'
import { SettingsDialog } from '@/components/settings-dialog'
import { SourceSelector } from '@/components/source-selector'
import { ViewModeToggle } from '@/components/view-mode-toggle'
import { useNotes } from '@/hooks/use-notes'
import { useSettings } from '@/hooks/use-settings'
import { useSources } from '@/hooks/use-sources'
import { useSync } from '@/hooks/use-sync'
import { useViewMode } from '@/hooks/use-view-mode'
import type { Note, SortOrder } from '@/lib/types'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { sources, activeSource, setActiveSourceId, addSource, updateSource, removeSource } = useSources()
  const { isOnline, isSyncing, pendingCount, sync } = useSync(activeSource)
  const {
    initializeSheets,
    isInitializing,
    anthropicApiKey,
    setAnthropicApiKey,
    clearAnthropicApiKey,
  } = useSettings()
  const { viewMode, setViewMode } = useViewMode()

  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes({
    search,
    tagFilter,
    sortOrder,
    sourceId: activeSource?.id,
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: notes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
    getItemKey: (index) => notes[index]?.id ?? index,
  })

  const handleSourceChange = (sourceId: string) => {
    setActiveSourceId(sourceId)
    setTagFilter([])  // Reset tag filter when changing source
  }

  const handleOpenModal = (note: Note) => {
    setSelectedNote(note)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedNote(null), 200) // Clear after animation
  }

  return (
    <div className="h-screen flex flex-col w-full p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <SourceSelector
            sources={sources}
            activeSource={activeSource}
            onSourceChange={handleSourceChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            onSync={sync}
          />
          <SettingsDialog
            sources={sources}
            onAddSource={addSource}
            onUpdateSource={updateSource}
            onRemoveSource={removeSource}
            onInitialize={initializeSheets}
            isInitializing={isInitializing}
            anthropicApiKey={anthropicApiKey}
            onSaveApiKey={setAnthropicApiKey}
            onClearApiKey={clearAnthropicApiKey}
          />
        </div>
      </div>

      {/* Search and sort controls */}
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
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div className="mb-4">
        <TagFilter selected={tagFilter} onChange={setTagFilter} sourceId={activeSource?.id} />
      </div>

      <div className="mb-4">
        <NoteForm onSubmit={createNote} />
      </div>

      {viewMode === 'list' ? (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground font-light">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground font-light py-8">
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
                      onOpenModal={() => handleOpenModal(notes[virtualRow.index])}
                      onDelete={() => deleteNote(notes[virtualRow.index].id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground font-light">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground font-light py-8">
              {search || tagFilter.length > 0
                ? 'No notes match your filters'
                : 'No notes yet. Create your first note above!'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  variant="grid"
                  onOpenModal={() => handleOpenModal(note)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <NoteModal
        note={selectedNote}
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        onUpdate={(data) => {
          if (selectedNote) {
            return updateNote({ id: selectedNote.id, ...data }) || Promise.resolve()
          }
          return Promise.resolve()
        }}
        onDelete={() => {
          if (selectedNote) {
            return (deleteNote(selectedNote.id) || Promise.resolve()).then(handleCloseModal)
          }
          return Promise.resolve()
        }}
      />
    </div>
  )
}
