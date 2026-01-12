import { SheetsDbClient } from '@/services/sheetsdb'
import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '@/config/constants'

function getSpreadsheetId(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.SPREADSHEET_ID)
}

function createClient(): SheetsDbClient | null {
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) return null

  return new SheetsDbClient({
    baseUrl: API_BASE_URL,
    spreadsheetId,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNotesSheet(): ReturnType<SheetsDbClient['sheet']> | null {
  const client = createClient()
  return client?.sheet('notes') ?? null
}

export function getSheetsClient(): SheetsDbClient | null {
  return createClient()
}

export async function isApiAvailable(): Promise<boolean> {
  const client = createClient()
  if (!client) return false

  try {
    await client.health()
    return true
  } catch {
    return false
  }
}

export function isConfigured(): boolean {
  return !!getSpreadsheetId()
}
