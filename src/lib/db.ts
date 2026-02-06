import Dexie, { type EntityTable } from 'dexie'
import type { Note, PendingSync } from './types'

export class NotesDB extends Dexie {
  notes!: EntityTable<Note, 'id'>
  pendingSync!: EntityTable<PendingSync, 'id'>

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
  }
}

export const db = new NotesDB()
