import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncStatusProps {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  onSync: () => void
}

export function SyncStatus({ isOnline, isSyncing, pendingCount, onSync }: SyncStatusProps) {
  return (
    <button
      onClick={onSync}
      disabled={!isOnline || isSyncing}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 border',
        isOnline
          ? 'bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)] border-[rgba(0,212,255,0.2)] hover:border-[var(--accent-cyan)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]'
          : 'bg-[rgba(167,139,250,0.1)] text-[var(--accent-purple)] border-[rgba(167,139,250,0.2)]'
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
