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
  onReset: () => Promise<boolean>
}

export function CacheResetPanel({
  activeSource,
  onReset,
}: CacheResetPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const isDisabled = !activeSource

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
          <p className="text-sm font-medium mb-1 text-foreground">Refresh Cache</p>
          <p className="text-xs text-muted-foreground font-light">
            Clear local cache and fetch fresh data from Google Sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isDisabled || isResetting}
          title={isDisabled ? 'Select a source to refresh cache' : ''}
          className="w-full px-4 py-3 bg-[rgba(236,72,153,0.1)] border border-[rgba(236,72,153,0.2)] text-[var(--accent-pink)] rounded-lg hover:bg-[rgba(236,72,153,0.2)] hover:border-[var(--accent-pink)] transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isResetting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              Refresh Cache
            </>
          )}
        </button>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[var(--accent-pink)]">Refresh Cache?</DialogTitle>
            <DialogDescription>
              This will clear your local cache and fetch fresh data from your Google Sheets source.
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
                  Refreshing...
                </>
              ) : (
                'Refresh Cache'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
