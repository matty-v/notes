import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { createMockNote, createMockPendingSync } from '../utils/factories'

describe('NotesDB', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.pendingSync.clear()
  })

  it('should create a note in IndexedDB', async () => {
    const note = createMockNote({
      id: 'test-123',
      title: 'Test Note',
      content: 'Test content',
      tags: 'work,urgent',
      createdAt: '2026-01-11T00:00:00.000Z',
      updatedAt: '2026-01-11T00:00:00.000Z',
    })

    await db.notes.add(note)
    const retrieved = await db.notes.get('test-123')

    expect(retrieved).toEqual(note)
  })

  it('should add pending sync entry', async () => {
    const pending = createMockPendingSync({
      id: 'sync-1',
      noteId: 'test-123',
      operation: 'create',
      timestamp: '2026-01-11T00:00:00.000Z',
    })

    await db.pendingSync.add(pending)
    const entries = await db.pendingSync.toArray()

    expect(entries).toHaveLength(1)
    expect(entries[0].operation).toBe('create')
  })
})
