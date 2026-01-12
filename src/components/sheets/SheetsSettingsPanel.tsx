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
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background"
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
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? savingButtonText : saveButtonText}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
              {connectedText}
            </p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline break-all"
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
    ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200'
    : isSuccess
      ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200'
      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200'

  return <div className={`p-3 rounded-lg text-sm font-medium ${bgColor}`}>{status}</div>
}
