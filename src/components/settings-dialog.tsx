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
import { SheetsSettingsPanel } from '@/components/sheets'
import { AnthropicSettingsPanel } from '@/components/anthropic'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

interface SettingsDialogProps {
  spreadsheetId: string
  onSave: (newId: string) => Promise<boolean>
  isSaving: boolean
  status: string
  anthropicApiKey: string
  onSaveApiKey: (key: string) => void
  onClearApiKey: () => void
}

export function SettingsDialog({
  spreadsheetId,
  onSave,
  isSaving,
  status,
  anthropicApiKey,
  onSaveApiKey,
  onClearApiKey,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempId, setTempId] = useState('')

  const handleSave = async () => {
    const success = await onSave(tempId)
    if (success) {
      setIsEditing(false)
      setTempId('')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsEditing(false)
      setTempId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Google Sheets Sync</h3>
            <SheetsSettingsPanel
              serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
              spreadsheetId={spreadsheetId}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
              tempInputValue={tempId}
              onTempInputChange={setTempId}
              onSave={handleSave}
              isSaving={isSaving}
              status={status}
            />
          </div>
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-3">AI Auto-Generation</h3>
            <AnthropicSettingsPanel
              apiKey={anthropicApiKey}
              onSave={onSaveApiKey}
              onClear={onClearApiKey}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
