import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface AnthropicSettingsPanelProps {
  apiKey: string
  onSave: (key: string) => void
  onClear: () => void
}

export function AnthropicSettingsPanel({
  apiKey,
  onSave,
  onClear,
}: AnthropicSettingsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempKey, setTempKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    onSave(tempKey)
    setIsEditing(false)
    setTempKey('')
    setShowKey(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTempKey('')
    setShowKey(false)
  }

  const handleStartEditing = () => {
    setTempKey(apiKey)
    setIsEditing(true)
  }

  const handleClear = () => {
    onClear()
    setIsEditing(false)
    setTempKey('')
    setShowKey(false)
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '••••••••'
    return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Claude API Key (Optional)</p>
        <p className="text-xs text-muted-foreground">
          Enable auto-generation of note titles and tags using Claude AI.{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            Get your API key
          </a>
        </p>
      </div>

      {isEditing ? (
        <>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-3 pr-10 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-sm bg-background text-foreground font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
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
              disabled={!tempKey}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </>
      ) : apiKey ? (
        <>
          <div className="p-4 bg-secondary/50 border border-border rounded-lg">
            <p className="text-sm text-foreground font-medium mb-2">API Key Configured</p>
            <code className="text-xs text-muted-foreground font-mono break-all">
              {maskApiKey(apiKey)}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleStartEditing}
              className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              Change API Key
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 py-3 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleStartEditing}
          className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
        >
          Add API Key
        </button>
      )}
    </div>
  )
}
