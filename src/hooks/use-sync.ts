import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPendingCount, processSyncQueue, pullFromRemote } from '@/lib/sync'
import { isApiAvailable } from '@/lib/notes-api'

export function useSync() {
  const queryClient = useQueryClient()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pendingSync'],
    queryFn: getPendingCount,
    refetchInterval: 5000,
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const sync = useCallback(async () => {
    if (isSyncing || !isOnline) return

    const available = await isApiAvailable()
    if (!available) return

    setIsSyncing(true)
    try {
      await processSyncQueue()
      await pullFromRemote()
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['pendingSync'] })
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, isOnline, queryClient])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      sync()
    }
  }, [isOnline, pendingCount, sync])

  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(sync, 30000)
    return () => clearInterval(interval)
  }, [isOnline, sync])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    sync,
  }
}
