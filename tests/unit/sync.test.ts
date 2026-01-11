import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { queueSync, getPendingCount } from '@/lib/sync'

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
    await queueSync('delete', { id: 'note-1' } as any)

    const pending = await db.pendingSync.toArray()
    expect(pending[0].operation).toBe('delete')
    expect(pending[0].noteId).toBe('note-1')
  })
})
