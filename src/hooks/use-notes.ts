import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { db } from '@/lib/db'
import { queueSync, pullFromRemote } from '@/lib/sync'
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
}

interface UseNotesOptions {
  search?: string
  tagFilter?: string[]
  sortOrder?: SortOrder
}

export function useNotes(options: UseNotesOptions = {}) {
  const queryClient = useQueryClient()
  const { search = '', tagFilter = [], sortOrder = 'newest' } = options
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    pullFromRemote().then(() => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    })
  }, [queryClient])

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', search, tagFilter, sortOrder],
    queryFn: async () => {
      let results = await db.notes.toArray()

      // Filter out soft-deleted notes
      results = results.filter((n) => !n.deletedAt)

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
      let title = input.title
      let tags = input.tags

      // Auto-generate title and/or tags if they're empty
      if (shouldGenerateTitle(title) || shouldGenerateTags(tags)) {
        const generated = await generateMetadata(input.content)
        if (generated) {
          if (shouldGenerateTitle(title)) {
            title = generated.title
          }
          if (shouldGenerateTags(tags)) {
            tags = generated.tags.join(', ')
          }
        }
      }

      const now = new Date().toISOString()
      const note: Note = {
        id: uuid(),
        title,
        content: input.content,
        tags,
        createdAt: now,
        updatedAt: now,
      }
      await db.notes.add(note)
      await queueSync('create', note)
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const existing = await db.notes.get(id)
      if (!existing) throw new Error('Note not found')

      let title = updates.title !== undefined ? updates.title : existing.title
      let tags = updates.tags !== undefined ? updates.tags : existing.tags
      const content = updates.content !== undefined ? updates.content : existing.content

      // Auto-generate title and/or tags if they're empty and content exists
      if (shouldGenerateTitle(title) || shouldGenerateTags(tags)) {
        const generated = await generateMetadata(content)
        if (generated) {
          if (shouldGenerateTitle(title)) {
            title = generated.title
          }
          if (shouldGenerateTags(tags)) {
            tags = generated.tags.join(', ')
          }
        }
      }

      const updated: Note = {
        ...existing,
        ...updates,
        title,
        tags,
        updatedAt: new Date().toISOString(),
      }
      await db.notes.put(updated)
      await queueSync('update', updated)
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const note = await db.notes.get(id)
      if (note) {
        const now = new Date().toISOString()
        const deletedNote = { ...note, deletedAt: now, updatedAt: now }
        await db.notes.put(deletedNote)
        await queueSync('update', deletedNote)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
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
