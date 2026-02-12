import Dexie, { type EntityTable } from 'dexie'
import type { Note } from './types'

export class NotesDB extends Dexie {
  notes!: EntityTable<Note, 'id'>

  constructor() {
    super('NotesDB')
    this.version(1).stores({
      notes: 'id, title, createdAt, updatedAt',
      pendingSync: 'id, noteId, operation, timestamp',
    })

    this.version(2)
      .stores({
        notes: 'id, sourceId, title, createdAt, updatedAt',
        pendingSync: 'id, sourceId, noteId, operation, timestamp',
      })
      .upgrade(async (tx) => {
        await tx
          .table('notes')
          .toCollection()
          .modify((note) => {
            if (!note.sourceId) {
              note.sourceId = 'default'
            }
          })
        await tx
          .table('pendingSync')
          .toCollection()
          .modify((record) => {
            if (!record.sourceId) {
              record.sourceId = 'default'
            }
          })
      })

    // Version 3: Remove pendingSync table (migration to online-first architecture)
    this.version(3)
      .stores({
        notes: 'id, sourceId, title, createdAt, updatedAt',
        pendingSync: null, // Delete table
      })
      .upgrade(async (tx) => {
        // Check if there are pending sync operations
        const pendingCount = await tx.table('pendingSync').count()
        if (pendingCount > 0) {
          // Store warning in localStorage to display to user
          localStorage.setItem('migration-warning-v3', 'true')
          console.warn(`⚠️ Migration v3: ${pendingCount} pending operations will be lost`)
        }
      })
  }
}

export const db = new NotesDB()
