import { SheetsDbClient } from 'sheets-db-client'
import type { Note } from './types'

const SHEETS_API_URL = import.meta.env.VITE_SHEETS_API_URL
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID

if (!SHEETS_API_URL || !SPREADSHEET_ID) {
  console.warn('Sheets API not configured - running in offline-only mode')
}

export const sheetsClient = SHEETS_API_URL && SPREADSHEET_ID
  ? new SheetsDbClient({
      baseUrl: SHEETS_API_URL,
      spreadsheetId: SPREADSHEET_ID,
    })
  : null

export const notesSheet = sheetsClient?.sheet<Note>('notes') ?? null

export async function isApiAvailable(): Promise<boolean> {
  if (!sheetsClient) return false
  try {
    await sheetsClient.health()
    return true
  } catch {
    return false
  }
}
