import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { db } from '@/lib/db'
import { toast } from '@/hooks/use-toast'
import {
  syncCreateToRemote,
  syncUpdateToRemote,
  syncDeleteToRemote,
} from '@/lib/sync-remote'
import type { Note, SortOrder } from '@/lib/types'
import {
  generateMetadata,
  shouldGenerateTitle,
  shouldGenerateTags,
} from '@/services/claude/generateMetadata'

interface CreateNoteInput {
  title: string
  content: string
  tags: string
  skipAutoGeneration?: boolean
}

interface UseNotesOptions {
  search?: string
  tagFilter?: string[]
  sortOrder?: SortOrder
  sourceId?: string
  spreadsheetId?: string
  onGeneratingMetadata?: (isGenerating: boolean) => void
}

export function useNotes(options: UseNotesOptions = {}) {
  const queryClient = useQueryClient()
  const { search = '', tagFilter = [], sortOrder = 'newest', sourceId, spreadsheetId, onGeneratingMetadata } = options

  // Snapshot storage for rollback on remote sync failure
  const snapshotsRef = useRef(new Map<string, Note | null>())

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', sourceId, search, tagFilter, sortOrder],
    queryFn: async () => {
      let results = await db.notes.toArray()

      // Filter out soft-deleted notes
      results = results.filter((n) => !n.deletedAt)

      // Filter by sourceId if provided
      if (sourceId) {
        results = results.filter((n) => n.sourceId === sourceId)
      }

      if (search) {
        const lower = search.toLowerCase()
        results = results.filter(
          (n) =>
            n.title.toLowerCase().includes(lower) ||
            n.content.toLowerCase().includes(lower)
        )
      }

      if (tagFilter.length > 0) {
        results = results.filter((n) => {
          const noteTags = n.tags.split(',').map((t) => t.trim()).filter(Boolean)
          return tagFilter.some((tag) => noteTags.includes(tag))
        })
      }

      results.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })

      return results
    },
  })

  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      if (!spreadsheetId) {
        throw new Error('No active source configured')
      }

      let title = input.title
      let tags = input.tags

      // Auto-generate title and/or tags if empty (still awaits Claude API)
      if (!input.skipAutoGeneration && (shouldGenerateTitle(title) || shouldGenerateTags(tags))) {
        onGeneratingMetadata?.(true)
        try {
          const generated = await generateMetadata(input.content)
          if (generated) {
            if (shouldGenerateTitle(title)) {
              title = generated.title
            }
            if (shouldGenerateTags(tags)) {
              tags = generated.tags.join(', ')
            }
          }
        } finally {
          onGeneratingMetadata?.(false)
        }
      }

      const now = new Date().toISOString()
      const note: Note = {
        id: uuid(),
        sourceId: sourceId || '',
        title,
        content: input.content,
        tags,
        createdAt: now,
        updatedAt: now,
      }

      // Write to IndexedDB immediately
      await db.notes.add(note)

      // Store null snapshot (no previous state for create — rollback = delete)
      snapshotsRef.current.set(note.id, null)

      return note
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })

      // Background sync to remote
      if (spreadsheetId) {
        syncCreateToRemote(note, spreadsheetId)
          .then(() => {
            snapshotsRef.current.delete(note.id)
          })
          .catch(async (err) => {
            console.error('Remote sync failed for create:', err)
            snapshotsRef.current.delete(note.id)
            // Rollback: remove from IndexedDB
            await db.notes.delete(note.id)
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            toast({
              variant: 'destructive',
              title: 'Sync failed',
              description: 'Note was not saved to Google Sheets. It has been removed.',
            })
          })
      }
    },
    onError: (error: Error) => {
      let title = 'Failed to create note'
      let description = 'Please try again'

      if (error.message.includes('No active source')) {
        title = 'No source configured'
        description = 'Configure Google Sheets source in settings'
      } else if (error.message.includes('Failed to fetch')) {
        title = 'Connection error'
        description = 'Check your internet connection'
      }

      toast({ variant: 'destructive', title, description })
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      if (!spreadsheetId) {
        throw new Error('No active source configured')
      }

      const existing = await db.notes.get(id)
      if (!existing) throw new Error('Note not found')

      let title = updates.title !== undefined ? updates.title : existing.title
      let tags = updates.tags !== undefined ? updates.tags : existing.tags
      const content = updates.content !== undefined ? updates.content : existing.content

      // Auto-generate title and/or tags if empty
      if (shouldGenerateTitle(title) || shouldGenerateTags(tags)) {
        onGeneratingMetadata?.(true)
        try {
          const generated = await generateMetadata(content)
          if (generated) {
            if (shouldGenerateTitle(title)) {
              title = generated.title
            }
            if (shouldGenerateTags(tags)) {
              tags = generated.tags.join(', ')
            }
          }
        } finally {
          onGeneratingMetadata?.(false)
        }
      }

      const updated: Note = {
        ...existing,
        ...updates,
        title,
        tags,
        sourceId: existing.sourceId,
        updatedAt: new Date().toISOString(),
      }

      // Store snapshot for rollback, then write to IndexedDB immediately
      snapshotsRef.current.set(id, existing)
      await db.notes.put(updated)

      return updated
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })

      // Background sync to remote
      if (spreadsheetId) {
        syncUpdateToRemote(updated, spreadsheetId)
          .then(() => {
            snapshotsRef.current.delete(updated.id)
          })
          .catch(async (err) => {
            console.error('Remote sync failed for update:', err)
            const snapshot = snapshotsRef.current.get(updated.id)
            snapshotsRef.current.delete(updated.id)
            if (snapshot) {
              await db.notes.put(snapshot)
            }
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            toast({
              variant: 'destructive',
              title: 'Sync failed',
              description: 'Changes were not saved to Google Sheets and have been reverted.',
            })
          })
      }
    },
    onError: (error: Error) => {
      let title = 'Failed to update note'
      let description = 'Please try again'

      if (error.message.includes('No active source')) {
        title = 'No source configured'
        description = 'Configure Google Sheets source in settings'
      } else if (error.message.includes('Note not found')) {
        title = 'Note not found'
        description = 'The note may have been deleted'
      } else if (error.message.includes('Failed to fetch')) {
        title = 'Connection error'
        description = 'Check your internet connection'
      }

      toast({ variant: 'destructive', title, description })
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      if (!spreadsheetId) {
        throw new Error('No active source configured')
      }

      const note = await db.notes.get(id)
      if (!note) throw new Error('Note not found')

      const now = new Date().toISOString()
      const deletedNote: Note = { ...note, deletedAt: now, updatedAt: now }

      // Store snapshot for rollback, then soft-delete in IndexedDB immediately
      snapshotsRef.current.set(id, note)
      await db.notes.put(deletedNote)

      return deletedNote
    },
    onSuccess: (deletedNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })

      // Background sync to remote
      if (spreadsheetId) {
        syncDeleteToRemote(deletedNote, spreadsheetId)
          .then(() => {
            snapshotsRef.current.delete(deletedNote.id)
          })
          .catch(async (err) => {
            console.error('Remote sync failed for delete:', err)
            const snapshot = snapshotsRef.current.get(deletedNote.id)
            snapshotsRef.current.delete(deletedNote.id)
            if (snapshot) {
              await db.notes.put(snapshot)
            }
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            toast({
              variant: 'destructive',
              title: 'Sync failed',
              description: 'Note was not deleted from Google Sheets and has been restored.',
            })
          })
      }
    },
    onError: (error: Error) => {
      let title = 'Failed to delete note'
      let description = 'Please try again'

      if (error.message.includes('No active source')) {
        title = 'No source configured'
        description = 'Configure Google Sheets source in settings'
      } else if (error.message.includes('Note not found')) {
        title = 'Note not found'
        description = 'The note may have already been deleted'
      } else if (error.message.includes('Failed to fetch')) {
        title = 'Connection error'
        description = 'Check your internet connection'
      }

      toast({ variant: 'destructive', title, description })
    },
  })

  return {
    notes,
    isLoading,
    createNote: createNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
  }
}
