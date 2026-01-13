import type { SheetsSetupWizardProps } from './types'

export function SheetsSetupWizard({
  serviceAccountEmail,
  inputValue,
  onInputChange,
  onConnect,
  isConnecting = false,
  title = 'Setup Required',
  connectButtonText = 'Connect',
  connectingButtonText = 'Initializing...',
  inputPlaceholder = 'Paste your Google Sheet ID here',
  additionalInstructions,
}: SheetsSetupWizardProps) {
  const handleConnect = async () => {
    await onConnect()
  }

  return (
    <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
      <p className="text-sm text-foreground font-medium mb-3">
        {title}
      </p>
      <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
        <li>Create a new Google Sheet</li>
        <li>
          Share it with:
          <br />
          <code className="block mt-1 p-2 bg-secondary rounded text-xs break-all select-all text-foreground">
            {serviceAccountEmail}
          </code>
          <span className="text-muted-foreground">(Editor access)</span>
        </li>
        <li>Copy the Sheet ID from the URL</li>
        <li>Paste below and click "{connectButtonText}"</li>
      </ol>
      {additionalInstructions && (
        <div className="mt-3 text-xs text-muted-foreground">
          {additionalInstructions}
        </div>
      )}
      <div className="mt-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleConnect}
          disabled={!inputValue || isConnecting}
          className="w-full mt-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? connectingButtonText : connectButtonText}
        </button>
      </div>
    </div>
  )
}
