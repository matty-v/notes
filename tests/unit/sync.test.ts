import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '@/lib/db'
import { queueSync, getPendingCount, pullFromRemote } from '@/lib/sync'
import type { Note } from '@/lib/types'

vi.mock('@/lib/notes-api', () => ({
  getNotesSheet: vi.fn(),
  isApiAvailable: vi.fn(),
}))

describe('Sync Service', () => {
  beforeEach(async () => {
    await db.pendingSync.clear()
    await db.notes.clear()
  })

  it('should queue a create operation', async () => {
    const note = {
      id: 'note-1',
      title: 'Test',
      content: 'Content',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await queueSync('create', note)

    const count = await getPendingCount()
    expect(count).toBe(1)
  })

  it('should queue a delete operation', async () => {
    await queueSync('delete', { id: 'note-1' } as Note)

    const pending = await db.pendingSync.toArray()
    expect(pending[0].operation).toBe('delete')
    expect(pending[0].noteId).toBe('note-1')
  })

  describe('pullFromRemote', () => {
it('should delete local notes when remote has deletedAt set', async () => {
      const { getNotesSheet, isApiAvailable } = await import('@/lib/notes-api')
      const mockedGetNotesSheet = vi.mocked(getNotesSheet)
      const mockedIsApiAvailable = vi.mocked(isApiAvailable)

      // Local has a note
      const localNote: Note = {
        id: 'note-1',
        title: 'Local Note',
        content: 'This exists locally',
        tags: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      await db.notes.add(localNote)

      // Remote has the same note but with deletedAt set (deleted on another device)
      const remoteNote: Note = {
        ...localNote,
        deletedAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      }

      mockedIsApiAvailable.mockResolvedValue(true)
      mockedGetNotesSheet.mockReturnValue({
        getRows: vi.fn().mockResolvedValue([remoteNote]),
      } as never)

      // Pull from remote
      await pullFromRemote()

      // The local note should be deleted because remote has deletedAt
      const result = await db.notes.get('note-1')
      expect(result).toBeUndefined()
    })

    it('should not restore notes that have pending delete operations', async () => {
      const { getNotesSheet, isApiAvailable } = await import('@/lib/notes-api')
      const mockedGetNotesSheet = vi.mocked(getNotesSheet)
      const mockedIsApiAvailable = vi.mocked(isApiAvailable)

      // Remote has a note
      const remoteNote: Note = {
        id: 'note-to-delete',
        title: 'Should Not Restore',
        content: 'This note was deleted locally',
        tags: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      mockedIsApiAvailable.mockResolvedValue(true)
      mockedGetNotesSheet.mockReturnValue({
        getRows: vi.fn().mockResolvedValue([remoteNote]),
      } as never)

      // Queue a delete for this note (simulating user deleted it locally)
      await queueSync('delete', remoteNote)

      // Pull from remote
      await pullFromRemote()

      // The note should NOT be restored because there's a pending delete
      const localNote = await db.notes.get('note-to-delete')
      expect(localNote).toBeUndefined()
    })
  })
})
