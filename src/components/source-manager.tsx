import { useState } from 'react'
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import type { NoteSource } from '@/lib/types'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

interface SourceManagerProps {
  sources: NoteSource[]
  onAdd: (name: string, spreadsheetId: string) => void
  onUpdate: (id: string, updates: Partial<Omit<NoteSource, 'id'>>) => void
  onRemove: (id: string) => void
  onInitialize: (spreadsheetId: string) => Promise<boolean>
  isInitializing: boolean
}

export function SourceManager({
  sources,
  onAdd,
  onUpdate,
  onRemove,
  onInitialize,
  isInitializing,
}: SourceManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSpreadsheetId, setNewSpreadsheetId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSpreadsheetId, setEditSpreadsheetId] = useState('')
  const [status, setStatus] = useState('')

  const handleAdd = async () => {
    if (!newName.trim() || !newSpreadsheetId.trim()) return
    setStatus('')
    const success = await onInitialize(newSpreadsheetId.trim())
    if (success) {
      onAdd(newName.trim(), newSpreadsheetId.trim())
      setNewName('')
      setNewSpreadsheetId('')
      setIsAdding(false)
      setStatus('')
    }
  }

  const handleStartEdit = (source: NoteSource) => {
    setEditingId(source.id)
    setEditName(source.name)
    setEditSpreadsheetId(source.spreadsheetId)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim() || !editSpreadsheetId.trim()) return
    const source = sources.find((s) => s.id === editingId)
    // If spreadsheet ID changed, initialize it
    if (source && source.spreadsheetId !== editSpreadsheetId.trim()) {
      const success = await onInitialize(editSpreadsheetId.trim())
      if (!success) return
    }
    onUpdate(editingId, { name: editName.trim(), spreadsheetId: editSpreadsheetId.trim() })
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditSpreadsheetId('')
  }

  return (
    <div className="space-y-3">
      {/* Source list */}
      {sources.map((source) => (
        <div key={source.id} className="p-3 bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] rounded-lg">
          {editingId === source.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Source name"
                className="w-full px-3 py-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] transition-all duration-300"
              />
              <input
                type="text"
                value={editSpreadsheetId}
                onChange={(e) => setEditSpreadsheetId(e.target.value)}
                placeholder="Spreadsheet ID"
                className="w-full px-3 py-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] transition-all duration-300"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isInitializing || !editName.trim() || !editSpreadsheetId.trim()}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg hover:bg-[rgba(0,212,255,0.8)] transition-all duration-300 text-sm font-medium disabled:opacity-50"
                >
                  <Check className="h-3 w-3" /> {isInitializing ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent-purple)] hover:text-[var(--accent-cyan)] underline transition-colors truncate block"
                >
                  Open Spreadsheet
                </a>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(source)}
                  className="p-1.5 text-muted-foreground hover:text-[var(--accent-cyan)] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(source.id)}
                  className="p-1.5 text-muted-foreground hover:text-[var(--accent-pink)] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add source form */}
      {isAdding ? (
        <div className="p-3 bg-[rgba(18,24,33,0.5)] border border-[rgba(0,212,255,0.2)] rounded-lg space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Source name (e.g. Work Notes)"
            className="w-full px-3 py-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] transition-all duration-300"
          />
          <input
            type="text"
            value={newSpreadsheetId}
            onChange={(e) => setNewSpreadsheetId(e.target.value)}
            placeholder="Google Sheet ID"
            className="w-full px-3 py-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] transition-all duration-300"
          />
          <p className="text-xs text-muted-foreground font-light">
            Share the spreadsheet with:
            <code className="block mt-1 p-2 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded text-xs break-all select-all text-[var(--accent-cyan)]">
              {SERVICE_ACCOUNT_EMAIL}
            </code>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setNewName(''); setNewSpreadsheetId(''); setStatus('') }}
              className="flex-1 px-3 py-2 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isInitializing || !newName.trim() || !newSpreadsheetId.trim()}
              className="flex-1 px-3 py-2 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg hover:bg-[rgba(0,212,255,0.8)] transition-all duration-300 text-sm font-medium disabled:opacity-50"
            >
              {isInitializing ? 'Connecting...' : 'Add & Connect'}
            </button>
          </div>
          {status && <p className="text-xs text-[var(--accent-pink)]">{status}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-transparent border border-dashed border-[rgba(100,150,255,0.3)] text-muted-foreground rounded-lg hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all duration-300 text-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Add Source
        </button>
      )}
    </div>
  )
}
