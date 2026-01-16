import { v4 as uuid } from 'uuid'
import { db } from './db'
import { getNotesSheet, isApiAvailable } from './notes-api'
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
  const notesSheet = getNotesSheet()
  if (!notesSheet || !(await isApiAvailable())) {
    return { success: 0, failed: 0 }
  }

  const pending = await db.pendingSync.orderBy('timestamp').toArray()
  let success = 0
  let failed = 0

  for (const item of pending) {
    try {
      if (item.operation === 'create' && item.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await notesSheet.createRow(item.data as any)
      } else if (item.operation === 'update' && item.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (await notesSheet.getRows()) as any[]
        const rowIndex = rows.findIndex((r) => r.id === item.noteId)
        if (rowIndex >= 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await notesSheet.updateRow(rowIndex + 2, item.data as any)
        }
      } else if (item.operation === 'delete') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (await notesSheet.getRows()) as any[]
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
  const notesSheet = getNotesSheet()
  if (!notesSheet || !(await isApiAvailable())) {
    return
  }

  // Get all note IDs with pending delete operations
  const pendingDeletes = await db.pendingSync
    .where('operation')
    .equals('delete')
    .toArray()
  const pendingDeleteIds = new Set(pendingDeletes.map((p) => p.noteId))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteNotes = (await notesSheet.getRows()) as any[]

  for (const remote of remoteNotes) {
    if (!remote.id) continue
    // Skip notes that have pending delete operations
    if (pendingDeleteIds.has(remote.id as string)) continue
    const local = await db.notes.get(remote.id as string)
    if (!local || new Date(remote.updatedAt as string) > new Date(local.updatedAt)) {
      await db.notes.put(remote as Note)
    }
  }
}
