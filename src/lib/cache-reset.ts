import { db } from './db'
import { getNotesSheet, isApiReachable } from './notes-api'
import type { Note } from './types'

export interface CacheResetOptions {
  onProgress?: (message: string) => void
}

export interface CacheResetResult {
  success: boolean
  error?: string
}

/**
 * Reset the local cache for a specific source.
 *
 * Approach:
 * 1. Check API reachability - abort if offline
 * 2. Fetch fresh data from remote BEFORE clearing (prevents data loss if fetch fails)
 * 3. Only after successful fetch: clear local cache and write fresh data
 *
 * @param sourceId - The source ID to reset cache for
 * @param spreadsheetId - The spreadsheet ID for the source
 * @param options - Optional callbacks and settings
 * @returns Result with success status and optional error message
 */
export async function resetCacheForSource(
  sourceId: string,
  spreadsheetId: string,
  options?: CacheResetOptions
): Promise<CacheResetResult> {
  const onProgress = options?.onProgress ?? (() => {})

  try {
    // Step 1: Check API reachability
    onProgress('Checking connection...')
    const isReachable = await isApiReachable()
    if (!isReachable) {
      return {
        success: false,
        error: 'API is not reachable. Please check your connection.',
      }
    }

    // Step 2: Fetch fresh data BEFORE clearing (critical for safety)
    onProgress('Fetching fresh data from source...')
    const notesSheet = getNotesSheet(spreadsheetId)
    const remoteNotes = await notesSheet.getRows<Note>()

    // Step 3: Only after successful fetch, clear local cache and write fresh data
    onProgress('Clearing local cache...')
    await db.notes.where('sourceId').equals(sourceId).delete()

    onProgress('Writing fresh data...')
    for (const remoteNote of remoteNotes) {
      if (remoteNote.id && !remoteNote.deletedAt) {
        await db.notes.put({
          ...remoteNote,
          sourceId,
        })
      }
    }

    onProgress('')
    return { success: true }
  } catch (error) {
    console.error('Cache reset failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cache reset failed. Please try again.',
    }
  }
}
