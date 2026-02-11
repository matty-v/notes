import { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SourceManager } from '@/components/source-manager'
import { AnthropicSettingsPanel } from '@/components/anthropic'
import { CacheResetPanel } from '@/components/cache-reset-panel'
import { useToast } from '@/hooks/use-toast'
import type { NoteSource } from '@/lib/types'

interface SettingsDialogProps {
  sources: NoteSource[]
  onAddSource: (name: string, spreadsheetId: string) => void
  onUpdateSource: (id: string, updates: Partial<Omit<NoteSource, 'id'>>) => void
  onRemoveSource: (id: string) => void
  onInitialize: (spreadsheetId: string) => Promise<boolean>
  isInitializing: boolean
  anthropicApiKey: string
  onSaveApiKey: (key: string) => void
  onClearApiKey: () => void
  activeSource: NoteSource | null
  pendingCount: number
  isOnline: boolean
  onResetCache: (sourceId: string, spreadsheetId: string) => Promise<boolean>
}

export function SettingsDialog({
  sources,
  onAddSource,
  onUpdateSource,
  onRemoveSource,
  onInitialize,
  isInitializing,
  anthropicApiKey,
  onSaveApiKey,
  onClearApiKey,
  activeSource,
  pendingCount,
  isOnline,
  onResetCache,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleResetCache = async (): Promise<boolean> => {
    if (!activeSource) return false

    const success = await onResetCache(activeSource.id, activeSource.spreadsheetId)
    if (success) {
      toast({
        title: 'Cache reset complete',
        description: 'Your notes have been refreshed from Google Sheets.',
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: 'Please check your connection and try again.',
      })
    }
    return success
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="glow-purple">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-cyan)]">Google Sheets Sync</h3>
            <SourceManager
              sources={sources}
              onAdd={onAddSource}
              onUpdate={onUpdateSource}
              onRemove={onRemoveSource}
              onInitialize={onInitialize}
              isInitializing={isInitializing}
            />
          </div>
          <div className="border-t border-[rgba(100,150,255,0.2)] pt-6">
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-purple)]">AI Auto-Generation</h3>
            <AnthropicSettingsPanel
              apiKey={anthropicApiKey}
              onSave={onSaveApiKey}
              onClear={onClearApiKey}
            />
          </div>
          <div className="border-t border-[rgba(100,150,255,0.2)] pt-6">
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-pink)]">Cache Management</h3>
            <CacheResetPanel
              activeSource={activeSource}
              pendingCount={pendingCount}
              isOnline={isOnline}
              onReset={handleResetCache}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
