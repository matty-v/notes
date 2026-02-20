import { useState, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { NoteCard } from '@/components/note-card'
import { NoteCardSkeleton } from '@/components/note-card-skeleton'
import { NoteModal } from '@/components/note-modal'
import { CreateNoteModal } from '@/components/create-note-modal'
import { TagFilter } from '@/components/tag-filter'
import { SettingsDialog } from '@/components/settings-dialog'
import { SourceSelector } from '@/components/source-selector'
import { ViewModeToggle } from '@/components/view-mode-toggle'
import { KanbanBoardView } from '@/components/kanban-board-view'
import { KanbanConfigDialog } from '@/components/kanban-config-dialog'
import { useBlockingOverlay } from '@/components/blocking-overlay'
import { useNotes } from '@/hooks/use-notes'
import { useSettings } from '@/hooks/use-settings'
import { useSources } from '@/hooks/use-sources'
import { useViewMode } from '@/hooks/use-view-mode'
import { useKanbanConfig } from '@/hooks/use-kanban-config'
import { toast } from '@/hooks/use-toast'
import { refreshCacheFromRemote } from '@/lib/cache'
import type { Note } from '@/lib/types'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createNoteTags, setCreateNoteTags] = useState<string[]>([])
  const [isKanbanConfigOpen, setIsKanbanConfigOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { withOverlay } = useBlockingOverlay()
  const queryClient = useQueryClient()
  const { sources, activeSource, setActiveSourceId, addSource, updateSource, removeSource } = useSources()
  const {
    initializeSheets,
    isInitializing,
    anthropicApiKey,
    setAnthropicApiKey,
    clearAnthropicApiKey,
    resetCache,
  } = useSettings()
  const { viewMode, setViewMode } = useViewMode()
  const kanbanConfig = useKanbanConfig(activeSource?.id ?? 'default')

  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes({
    search,
    tagFilter,
    sortOrder: 'newest',
    sourceId: activeSource?.id,
    spreadsheetId: activeSource?.spreadsheetId,
    onGeneratingMetadata: setIsGeneratingAI,
  })

  // Show migration warning if present
  useEffect(() => {
    const hasWarning = localStorage.getItem('migration-warning-v3')
    if (hasWarning) {
      toast({
        variant: 'destructive',
        title: 'App Updated',
        description: 'Offline mode removed. Any unsynced changes may be lost. Refresh cache in settings.',
      })
      localStorage.removeItem('migration-warning-v3')
    }
  }, [])

  // Always perform hard refresh on load and when source changes
  useEffect(() => {
    if (!activeSource?.id || !activeSource?.spreadsheetId) {
      setIsInitialLoad(false)
      return
    }

    setIsInitialLoad(true)
    const clearAndRefresh = async () => {
      try {
        // Hard refresh: clear cache and fetch fresh data
        await refreshCacheFromRemote(activeSource.id, activeSource.spreadsheetId)
        await queryClient.invalidateQueries({ queryKey: ['notes'] })
        await queryClient.invalidateQueries({ queryKey: ['tags'] })
      } catch (err) {
        console.error('Cache refresh failed:', err)
        toast({
          variant: 'destructive',
          title: 'Failed to load notes',
          description: 'Could not fetch notes from Google Sheets. Check your connection.',
        })
      } finally {
        setIsInitialLoad(false)
      }
    }

    clearAndRefresh()
  }, [activeSource?.id, activeSource?.spreadsheetId, queryClient])

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

  const handleRefresh = async () => {
    if (!activeSource?.id || !activeSource?.spreadsheetId || isRefreshing) return

    setIsRefreshing(true)
    try {
      await refreshCacheFromRemote(activeSource.id, activeSource.spreadsheetId)
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      await queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast({
        title: 'Cache refreshed',
        description: 'Notes refreshed from Google Sheets',
      })
    } catch (err) {
      console.error('Cache refresh failed:', err)
      toast({
        variant: 'destructive',
        title: 'Refresh failed',
        description: err instanceof Error ? err.message : 'Failed to refresh cache',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col w-full p-4 lg:p-6">
      {/* Top bar with source selector, sync status, and new note button */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SourceSelector
            sources={sources}
            activeSource={activeSource}
            onSourceChange={handleSourceChange}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={!activeSource || isRefreshing}
            title="Refresh notes from Google Sheets"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 border bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)] border-[rgba(0,212,255,0.2)] hover:border-[var(--accent-cyan)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh cache"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
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
            activeSource={activeSource}
            onResetCache={resetCache}
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
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          onConfigureKanban={() => setIsKanbanConfigOpen(true)}
        />
      </div>

      <div className="mb-4">
        <TagFilter selected={tagFilter} onChange={setTagFilter} sourceId={activeSource?.id} />
      </div>

      {isInitialLoad ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground font-light">Loading notes...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <NoteCardSkeleton key={i} variant="list" />
              ))}
            </div>
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
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <NoteCardSkeleton key={i} variant="grid" />
              ))}
            </div>
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
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <KanbanBoardView
          notes={notes}
          config={kanbanConfig.config}
          onNoteClick={handleOpenModal}
          onOpenConfig={() => setIsKanbanConfigOpen(true)}
          onUpdateNote={(noteId, tags) => {
            const note = notes.find((n) => n.id === noteId)
            if (note) {
              withOverlay(() => updateNote({ id: noteId, tags }), 'Updating note...')
            }
          }}
          onAddNote={(tag) => {
            setCreateNoteTags([tag])
            setIsCreateModalOpen(true)
          }}
          isLoading={isLoading}
        />
      )}

      <CreateNoteModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open)
          if (!open) setCreateNoteTags([])
        }}
        onSubmit={async (data) => {
          await withOverlay(() => createNote(data), 'Creating note...')
        }}
        initialTags={createNoteTags}
        sourceId={activeSource?.id}
        isGeneratingAI={isGeneratingAI}
      />

      <NoteModal
        note={selectedNote}
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        isGeneratingAI={isGeneratingAI}
        onUpdate={(data) => {
          if (selectedNote) {
            return withOverlay(async () => {
              const updated = await updateNote({ id: selectedNote.id, ...data })
              if (updated) {
                setSelectedNote(updated)
              }
            }, 'Updating note...')
          }
          return Promise.resolve()
        }}
        onDelete={() => {
          if (selectedNote) {
            return withOverlay(async () => {
              await deleteNote(selectedNote.id)
              handleCloseModal()
            }, 'Deleting note...')
          }
          return Promise.resolve()
        }}
      />

      <button
        onClick={() => { setCreateNoteTags([]); setIsCreateModalOpen(true) }}
        disabled={isInitialLoad}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] hover:from-[var(--accent-purple)] hover:to-[var(--accent-pink)] text-[#0a0e14] shadow-lg hover:shadow-[0_0_24px_rgba(0,212,255,0.4)] transition-all duration-300 flex items-center justify-center z-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="New Note"
      >
        <Plus className="h-6 w-6" />
      </button>

      <KanbanConfigDialog
        open={isKanbanConfigOpen}
        onOpenChange={setIsKanbanConfigOpen}
        config={kanbanConfig.config}
        sourceId={activeSource?.id ?? 'default'}
        onAddColumn={kanbanConfig.addColumn}
        onRemoveColumn={kanbanConfig.removeColumn}
        onReorderColumn={kanbanConfig.reorderColumn}
        onUpdateDefaultColumn={kanbanConfig.updateDefaultColumn}
      />
    </div>
  )
}
