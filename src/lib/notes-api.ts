import { SheetsDbClient } from '@/services/sheetsdb'
import { API_BASE_URL } from '@/config/constants'

function createClient(spreadsheetId: string): SheetsDbClient {
  return new SheetsDbClient({
    baseUrl: API_BASE_URL,
    spreadsheetId,
  })
}

export function getNotesSheet(spreadsheetId: string): ReturnType<SheetsDbClient['sheet']> {
  const client = createClient(spreadsheetId)
  return client.sheet('notes')
}

export function getSheetsClient(spreadsheetId: string): SheetsDbClient {
  return createClient(spreadsheetId)
}

export async function isApiAvailable(spreadsheetId: string): Promise<boolean> {
  try {
    const client = createClient(spreadsheetId)
    await client.health()
    return true
  } catch {
    return false
  }
}

export async function isApiReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
