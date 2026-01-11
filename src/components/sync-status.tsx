import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const { isOnline, isSyncing, pendingCount, sync } = useSync()

  return (
    <button
      onClick={sync}
      disabled={!isOnline || isSyncing}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors',
        isOnline
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      )}
    >
      {isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {isOnline ? (
        pendingCount > 0 ? `${pendingCount} pending` : 'Synced'
      ) : (
        `Offline${pendingCount > 0 ? ` - ${pendingCount} pending` : ''}`
      )}
    </button>
  )
}
