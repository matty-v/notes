import type { SheetsSettingsPanelProps } from './types'

export function SheetsSettingsPanel({
  serviceAccountEmail,
  spreadsheetId,
  isEditing,
  onEditingChange,
  tempInputValue,
  onTempInputChange,
  onSave,
  isSaving = false,
  saveButtonText = 'Save & Initialize',
  savingButtonText = 'Initializing...',
  inputPlaceholder = 'Paste your Google Sheet ID here',
  connectedText = 'Connected',
  changeButtonText = 'Change Spreadsheet',
  status,
}: SheetsSettingsPanelProps) {
  const handleSave = async () => {
    await onSave()
  }

  const handleCancel = () => {
    onEditingChange(false)
    onTempInputChange('')
  }

  const handleStartEditing = () => {
    onTempInputChange(spreadsheetId)
    onEditingChange(true)
  }

  return (
    <div className="space-y-4">
      {isEditing ? (
        <>
          <p className="text-sm font-medium">Change Spreadsheet</p>
          <p className="text-xs text-muted-foreground">
            Make sure to share the new spreadsheet with:
            <br />
            <code className="block mt-1 p-2 bg-secondary rounded text-xs break-all select-all">
              {serviceAccountEmail}
            </code>
          </p>
          <div>
            <input
              type="text"
              value={tempInputValue}
              onChange={(e) => onTempInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-sm bg-background text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !tempInputValue}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? savingButtonText : saveButtonText}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 bg-secondary/50 border border-border rounded-lg">
            <p className="text-sm text-foreground font-medium mb-2">
              {connectedText}
            </p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80 underline break-all"
            >
              Open Spreadsheet
            </a>
          </div>
          <button
            type="button"
            onClick={handleStartEditing}
            className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            {changeButtonText}
          </button>
        </>
      )}

      {status && <StatusMessage status={status} />}
    </div>
  )
}

function StatusMessage({ status }: { status: string }) {
  if (!status) return null

  const isError =
    status.includes('error') || status.includes('Error') || status.includes('failed')
  const isSuccess = status.includes('success') || status.includes('Success')

  const bgColor = isError
    ? 'bg-destructive/10 text-destructive border border-destructive/20'
    : isSuccess
      ? 'bg-secondary/50 text-foreground border border-border'
      : 'bg-muted/50 text-muted-foreground border border-border'

  return <div className={`p-3 rounded-lg text-sm font-medium ${bgColor}`}>{status}</div>
}
