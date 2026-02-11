import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { NoteSource } from '@/lib/types'

interface CacheResetPanelProps {
  activeSource: NoteSource | null
  pendingCount: number
  isOnline: boolean
  onReset: () => Promise<boolean>
}

export function CacheResetPanel({
  activeSource,
  pendingCount,
  isOnline,
  onReset,
}: CacheResetPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const isDisabled = !activeSource || !isOnline

  const getDisabledReason = (): string => {
    if (!activeSource) return 'Select a source to reset cache'
    if (!isOnline) return 'Go online to reset cache'
    return ''
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const success = await onReset()
      if (success) {
        setIsConfirmOpen(false)
      }
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1 text-foreground">Reset Local Cache</p>
          <p className="text-xs text-muted-foreground font-light">
            Wipe local notes and fetch fresh data from Google Sheets. Pending changes will be synced first.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isDisabled || isResetting}
          title={getDisabledReason()}
          className="w-full px-4 py-3 bg-[rgba(236,72,153,0.1)] border border-[rgba(236,72,153,0.2)] text-[var(--accent-pink)] rounded-lg hover:bg-[rgba(236,72,153,0.2)] hover:border-[var(--accent-pink)] transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isResetting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              Reset Cache
            </>
          )}
        </button>

        {pendingCount > 0 && (
          <p className="text-xs text-[var(--accent-cyan)] bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded px-3 py-2">
            ℹ️ You have {pendingCount} pending change{pendingCount !== 1 ? 's' : ''} that will be synced before reset.
          </p>
        )}
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[var(--accent-pink)]">Reset Cache?</DialogTitle>
            <DialogDescription>
              This will delete all local notes and fetch fresh data from your Google Sheets source.
              {pendingCount > 0 && (
                <>
                  <br />
                  <br />
                  <span className="text-[var(--accent-cyan)] font-medium">
                    ℹ️ Your {pendingCount} pending change{pendingCount !== 1 ? 's' : ''} will be synced to the
                    server before reset.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-[var(--accent-pink)] hover:bg-[rgba(236,72,153,0.9)] text-white"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                'Reset Cache'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
