import { db } from './db'
import { getNotesSheet, isApiReachable } from './notes-api'
import type { Note } from './types'

/**
 * Refresh local IndexedDB cache from remote Google Sheets
 * This replaces local cache with fresh data from the source of truth
 */
export async function refreshCacheFromRemote(
  sourceId: string,
  spreadsheetId: string
): Promise<void> {
  if (!(await isApiReachable())) {
    throw new Error('API is not reachable')
  }

  const notesSheet = getNotesSheet(spreadsheetId)

  // Fetch all remote notes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteNotes = (await notesSheet.getRows()) as any[]

  // Clear existing notes for this source
  await db.notes.where('sourceId').equals(sourceId).delete()

  // Write fresh data to cache
  for (const remote of remoteNotes) {
    if (!remote.id) continue

    const note: Note = {
      ...remote,
      sourceId,
    } as Note

    await db.notes.put(note)
  }
}
