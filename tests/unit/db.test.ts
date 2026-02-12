import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'

describe('NotesDB', () => {
  beforeEach(async () => {
    await db.notes.clear()
  })

  it('should create a note in IndexedDB', async () => {
    const note = {
      id: 'test-123',
      sourceId: 'test-source',
      title: 'Test Note',
      content: 'Test content',
      tags: 'work,urgent',
      createdAt: '2026-01-11T00:00:00.000Z',
      updatedAt: '2026-01-11T00:00:00.000Z',
    }

    await db.notes.add(note)
    const retrieved = await db.notes.get('test-123')

    expect(retrieved).toEqual(note)
  })
})
