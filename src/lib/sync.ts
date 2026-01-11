import { v4 as uuid } from 'uuid'
import { db } from './db'
import { notesSheet, isApiAvailable } from './notes-api'
import type { Note, PendingSync } from './types'

export async function queueSync(
  operation: PendingSync['operation'],
  note: Note
): Promise<void> {
  await db.pendingSync.add({
    id: uuid(),
    noteId: note.id,
    operation,
    data: operation !== 'delete' ? note : undefined,
    timestamp: new Date().toISOString(),
  })
}

export async function getPendingCount(): Promise<number> {
  return db.pendingSync.count()
}

export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  if (!notesSheet || !(await isApiAvailable())) {
    return { success: 0, failed: 0 }
  }

  const pending = await db.pendingSync.orderBy('timestamp').toArray()
  let success = 0
  let failed = 0

  for (const item of pending) {
    try {
      if (item.operation === 'create' && item.data) {
        await notesSheet.createRow(item.data)
      } else if (item.operation === 'update' && item.data) {
        const rows = await notesSheet.getRows()
        const rowIndex = rows.findIndex((r) => r.id === item.noteId)
        if (rowIndex >= 0) {
          await notesSheet.updateRow(rowIndex + 2, item.data)
        }
      } else if (item.operation === 'delete') {
        const rows = await notesSheet.getRows()
        const rowIndex = rows.findIndex((r) => r.id === item.noteId)
        if (rowIndex >= 0) {
          await notesSheet.deleteRow(rowIndex + 2)
        }
      }
      await db.pendingSync.delete(item.id)
      success++
    } catch (error) {
      console.error('Sync failed for item:', item.id, error)
      failed++
    }
  }

  return { success, failed }
}

export async function pullFromRemote(): Promise<void> {
  if (!notesSheet || !(await isApiAvailable())) {
    return
  }

  const remoteNotes = await notesSheet.getRows()

  for (const remote of remoteNotes) {
    const local = await db.notes.get(remote.id)
    if (!local || new Date(remote.updatedAt) > new Date(local.updatedAt)) {
      await db.notes.put(remote)
    }
  }
}
