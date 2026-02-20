import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { db } from '@/lib/db'
import { getNotesSheet } from '@/lib/notes-api'
import { SheetsDbError } from '@/services/sheetsdb/SheetsDbError'
import { toast } from '@/hooks/use-toast'
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
      // Validate spreadsheetId
      if (!spreadsheetId) {
        throw new Error('No active source configured')
      }

      let title = input.title
      let tags = input.tags

      // Auto-generate title and/or tags if they're empty (unless skipAutoGeneration is true)
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

      // Write to remote FIRST
      const notesSheet = getNotesSheet(spreadsheetId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await notesSheet.createRow(note as any)

      // Update local cache ONLY after remote success
      await db.notes.add(note)

      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: (error: Error) => {
      let title = 'Failed to create note'
      let description = 'Please try again'

      if (error.message.includes('No active source')) {
        title = 'No source configured'
        description = 'Configure Google Sheets source in settings'
      } else if (error instanceof SheetsDbError) {
        if (error.status === 401 || error.status === 403) {
          title = 'Permission denied'
          description = 'Check your Google Sheets permissions'
        } else if (error.status >= 500) {
          title = 'Server error'
          description = 'Google Sheets API is experiencing issues'
        }
      } else if (error.message.includes('Failed to fetch')) {
        title = 'Connection error'
        description = 'Check your internet connection'
      }

      toast({ variant: 'destructive', title, description })
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      // Validate spreadsheetId
      if (!spreadsheetId) {
        throw new Error('No active source configured')
      }

      const existing = await db.notes.get(id)
      if (!existing) throw new Error('Note not found')

      let title = updates.title !== undefined ? updates.title : existing.title
      let tags = updates.tags !== undefined ? updates.tags : existing.tags
      const content = updates.content !== undefined ? updates.content : existing.content

      // Auto-generate title and/or tags if they're empty and content exists
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

      // Write to remote FIRST
      const notesSheet = getNotesSheet(spreadsheetId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (await notesSheet.getRows()) as any[]
      const rowIndex = rows.findIndex((r) => r.id === id)

      if (rowIndex < 0) {
        throw new Error('Note not found in remote sheet')
      }

      // Row index + 2 because row 1 is headers and API rows are 0-indexed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await notesSheet.updateRow(rowIndex + 2, updated as any)

      // Update local cache ONLY after remote success
      await db.notes.put(updated)

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
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
      } else if (error instanceof SheetsDbError) {
        if (error.status === 404) {
          title = 'Note not found'
          description = 'The note may have been deleted from the sheet'
        } else if (error.status === 401 || error.status === 403) {
          title = 'Permission denied'
          description = 'Check your Google Sheets permissions'
        } else if (error.status >= 500) {
          title = 'Server error'
          description = 'Google Sheets API is experiencing issues'
        }
      } else if (error.message.includes('Failed to fetch')) {
        title = 'Connection error'
        description = 'Check your internet connection'
      }

      toast({ variant: 'destructive', title, description })
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      // Validate spreadsheetId
      if (!spreadsheetId) {
        throw new Error('No active source configured')
      }

      const note = await db.notes.get(id)
      if (!note) throw new Error('Note not found')

      const now = new Date().toISOString()
      const deletedNote = { ...note, deletedAt: now, updatedAt: now }

      // Write to remote FIRST (soft delete)
      const notesSheet = getNotesSheet(spreadsheetId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (await notesSheet.getRows()) as any[]
      const rowIndex = rows.findIndex((r) => r.id === id)

      if (rowIndex < 0) {
        throw new Error('Note not found in remote sheet')
      }

      // Soft delete via updateRow with deletedAt timestamp
      // Row index + 2 because row 1 is headers and API rows are 0-indexed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await notesSheet.updateRow(rowIndex + 2, deletedNote as any)

      // Update local cache ONLY after remote success
      await db.notes.put(deletedNote)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
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
      } else if (error instanceof SheetsDbError) {
        if (error.status === 404) {
          title = 'Note not found'
          description = 'The note may have already been deleted from the sheet'
        } else if (error.status === 401 || error.status === 403) {
          title = 'Permission denied'
          description = 'Check your Google Sheets permissions'
        } else if (error.status >= 500) {
          title = 'Server error'
          description = 'Google Sheets API is experiencing issues'
        }
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
    isCreating: createNote.isPending,
    isUpdating: updateNote.isPending,
    createNote: createNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
  }
}
