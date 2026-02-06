import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SheetsDbClient } from '@/services/sheetsdb'
import { LOCAL_STORAGE_KEYS, API_BASE_URL, SHEETS_CONFIG } from '@/config/constants'

export function useSettings() {
  const queryClient = useQueryClient()

  const [anthropicApiKey, setAnthropicApiKeyState] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.ANTHROPIC_API_KEY) || ''
  )
  const [isInitializing, setIsInitializing] = useState(false)
  const [status, setStatus] = useState('')

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

      await client.health()

      const existingSheets = await client.listSheets()
      const existingNames = existingSheets.map((s) => s.title)

      for (const [sheetName, columns] of Object.entries(SHEETS_CONFIG)) {
        if (!existingNames.includes(sheetName)) {
          await client.createSheet(sheetName)
          const placeholderData: Record<string, string> = {}
          columns.forEach((col) => {
            placeholderData[col] = ''
          })
          const { rowIndex } = await client.createRow(sheetName, placeholderData)
          await client.deleteRow(sheetName, rowIndex)
        }
      }

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

  return {
    anthropicApiKey,
    setAnthropicApiKey,
    clearAnthropicApiKey,
    initializeSheets,
    isInitializing,
    status,
    setStatus,
  }
}
