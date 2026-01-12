import { useState } from 'react'
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
  const { spreadsheetId, connectSpreadsheet, isInitializing, status } = useSettings()

  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes({
    search,
    tagFilter,
    sortOrder,
  })

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <div className="flex items-center gap-2">
          <SyncStatus />
          <SettingsDialog
            spreadsheetId={spreadsheetId}
            onSave={connectSpreadsheet}
            isSaving={isInitializing}
            status={status}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
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

      <TagFilter selected={tagFilter} onChange={setTagFilter} />

      <NoteForm onSubmit={createNote} />

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search || tagFilter.length > 0
              ? 'No notes match your filters'
              : 'No notes yet. Create your first note above!'}
          </p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={(data) => updateNote({ id: note.id, ...data })}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
