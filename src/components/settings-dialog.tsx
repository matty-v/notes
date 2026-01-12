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
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

interface SettingsDialogProps {
  spreadsheetId: string
  onSave: (newId: string) => Promise<boolean>
  isSaving: boolean
  status: string
}

export function SettingsDialog({
  spreadsheetId,
  onSave,
  isSaving,
  status,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  )
}
