import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SheetsDbClient } from '@/services/sheetsdb'
import { LOCAL_STORAGE_KEYS, API_BASE_URL, SHEETS_CONFIG } from '@/config/constants'

export function useSettings() {
  const queryClient = useQueryClient()

  const [spreadsheetId, setSpreadsheetIdState] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.SPREADSHEET_ID) || ''
  )
  const [anthropicApiKey, setAnthropicApiKeyState] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.ANTHROPIC_API_KEY) || ''
  )
  const [isInitializing, setIsInitializing] = useState(false)
  const [status, setStatus] = useState('')

  const setSpreadsheetId = useCallback((id: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SPREADSHEET_ID, id)
    setSpreadsheetIdState(id)
  }, [])

  const clearSpreadsheetId = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SPREADSHEET_ID)
    setSpreadsheetIdState('')
  }, [])

  const setAnthropicApiKey = useCallback((key: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ANTHROPIC_API_KEY, key)
    setAnthropicApiKeyState(key)
  }, [])

  const clearAnthropicApiKey = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ANTHROPIC_API_KEY)
    setAnthropicApiKeyState('')
  }, [])

  const initializeSheets = useCallback(async (sheetId: string): Promise<boolean> => {
    setIsInitializing(true)
    setStatus('')

    try {
      const client = new SheetsDbClient({
        baseUrl: API_BASE_URL,
        spreadsheetId: sheetId,
      })

      // Check if we can connect
      await client.health()

      // List existing sheets
      const existingSheets = await client.listSheets()
      const existingNames = existingSheets.map((s) => s.title)

      // Create missing sheets
      const createdSheets: string[] = []
      for (const [sheetName, columns] of Object.entries(SHEETS_CONFIG)) {
        if (!existingNames.includes(sheetName)) {
          await client.createSheet(sheetName)
          // Initialize with column headers by creating and deleting a placeholder row
          const placeholderData: Record<string, string> = {}
          columns.forEach((col) => {
            placeholderData[col] = ''
          })
          const { rowIndex } = await client.createRow(sheetName, placeholderData)
          await client.deleteRow(sheetName, rowIndex)
          createdSheets.push(sheetName)
        }
      }

      if (createdSheets.length > 0) {
        setStatus(`Created sheets: ${createdSheets.join(', ')}`)
      } else {
        setStatus('Connected successfully!')
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })

      return true
    } catch (error) {
      console.error('Failed to initialize sheets:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to connect'}`)
      return false
    } finally {
      setIsInitializing(false)
    }
  }, [queryClient])

  const connectSpreadsheet = useCallback(async (sheetId: string): Promise<boolean> => {
    const success = await initializeSheets(sheetId)
    if (success) {
      setSpreadsheetId(sheetId)
    }
    return success
  }, [initializeSheets, setSpreadsheetId])

  return {
    spreadsheetId,
    setSpreadsheetId,
    clearSpreadsheetId,
    anthropicApiKey,
    setAnthropicApiKey,
    clearAnthropicApiKey,
    initializeSheets,
    connectSpreadsheet,
    isInitializing,
    status,
    setStatus,
  }
}
