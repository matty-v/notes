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
    if (key.length <= 8) return '--------'
    return `${key.substring(0, 4)}--------${key.substring(key.length - 4)}`
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1 text-foreground">Claude API Key (Optional)</p>
        <p className="text-xs text-muted-foreground font-light">
          Enable auto-generation of note titles and tags using Claude AI.{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-cyan)] hover:text-[var(--accent-purple)] underline transition-colors"
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
              className="w-full px-4 py-3 pr-10 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground font-mono focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[var(--accent-cyan)] transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!tempKey}
              className="flex-1 px-4 py-3 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </>
      ) : apiKey ? (
        <>
          <div className="p-4 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg">
            <p className="text-sm text-[var(--accent-cyan)] font-medium mb-2">API Key Configured</p>
            <code className="text-xs text-muted-foreground font-mono break-all">
              {maskApiKey(apiKey)}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleStartEditing}
              className="flex-1 px-4 py-3 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm font-medium"
            >
              Change API Key
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 py-3 bg-[rgba(236,72,153,0.1)] border border-[rgba(236,72,153,0.2)] text-[var(--accent-pink)] rounded-lg hover:bg-[rgba(236,72,153,0.2)] hover:border-[var(--accent-pink)] transition-all duration-300 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleStartEditing}
          className="w-full px-4 py-3 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm font-medium"
        >
          Add API Key
        </button>
      )}
    </div>
  )
}
