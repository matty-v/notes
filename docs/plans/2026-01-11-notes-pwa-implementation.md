# Notes PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a PWA for creating and viewing notes with full offline support, backed by Google Sheets.

**Architecture:** IndexedDB (Dexie) as primary local store with background sync to Sheets API. All CRUD operations hit local DB first, then queue for sync. Service worker caches app shell for offline access.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, Radix UI, Dexie.js, vite-plugin-pwa, sheets-db-client SDK

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
npm install dexie uuid vite-plugin-pwa
npm install --save-dev @types/uuid
```

**Step 2: Link the sheets-db-client SDK locally**

Run:
```bash
npm install ../sheets-db-api/sdk
```

**Step 3: Verify installation**

Run: `npm ls dexie uuid vite-plugin-pwa sheets-db-client`
Expected: All packages listed without errors

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add dexie, uuid, vite-plugin-pwa, sheets-db-client deps"
```

---

## Task 2: Configure PWA and Environment

**Files:**
- Modify: `vite.config.ts`
- Modify: `.env.example`
- Create: `.env`
- Modify: `index.html`

**Step 1: Update vite.config.ts with PWA plugin**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Notes',
        short_name: 'Notes',
        description: 'Quick notes with offline support',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: Update .env.example**

```
VITE_API_URL=
VITE_SHEETS_API_URL=https://sheetsapi-g56q77hy2a-uc.a.run.app
VITE_SPREADSHEET_ID=your-spreadsheet-id-here
```

**Step 3: Create .env with actual values (do not commit)**

Create `.env` locally with your actual spreadsheet ID.

**Step 4: Update index.html title and meta**

Change `<title>` to "Notes" and add theme-color meta tag:
```html
<meta name="theme-color" content="#0f172a" />
<title>Notes</title>
```

**Step 5: Verify build works**

Run: `npm run build`
Expected: Build succeeds, `dist/` contains `sw.js` and `manifest.webmanifest`

**Step 6: Commit**

```bash
git add vite.config.ts .env.example index.html
git commit -m "chore: configure PWA with vite-plugin-pwa"
```

---

## Task 3: Define Types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Create types file**

```typescript
export interface Note {
  id: string
  title: string
  content: string
  tags: string
  createdAt: string
  updatedAt: string
}

export interface PendingSync {
  id: string
  noteId: string
  operation: 'create' | 'update' | 'delete'
  data?: Note
  timestamp: string
}

export type SortOrder = 'newest' | 'oldest'
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add Note and PendingSync types"
```

---

## Task 4: Create Dexie Database Schema

**Files:**
- Create: `src/lib/db.ts`
- Create: `tests/unit/db.test.ts`

**Step 1: Write failing test for database schema**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { db, NotesDB } from '@/lib/db'

describe('NotesDB', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.pendingSync.clear()
  })

  it('should create a note in IndexedDB', async () => {
    const note = {
      id: 'test-123',
      title: 'Test Note',
      content: 'Test content',
      tags: 'work,urgent',
      createdAt: '2026-01-11T00:00:00.000Z',
      updatedAt: '2026-01-11T00:00:00.000Z',
    }

    await db.notes.add(note)
    const retrieved = await db.notes.get('test-123')

    expect(retrieved).toEqual(note)
  })

  it('should add pending sync entry', async () => {
    const pending = {
      id: 'sync-1',
      noteId: 'test-123',
      operation: 'create' as const,
      timestamp: '2026-01-11T00:00:00.000Z',
    }

    await db.pendingSync.add(pending)
    const entries = await db.pendingSync.toArray()

    expect(entries).toHaveLength(1)
    expect(entries[0].operation).toBe('create')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/db.test.ts`
Expected: FAIL - module not found

**Step 3: Create db.ts**

```typescript
import Dexie, { type EntityTable } from 'dexie'
import type { Note, PendingSync } from './types'

export class NotesDB extends Dexie {
  notes!: EntityTable<Note, 'id'>
  pendingSync!: EntityTable<PendingSync, 'id'>

  constructor() {
    super('NotesDB')
    this.version(1).stores({
      notes: 'id, title, createdAt, updatedAt',
      pendingSync: 'id, noteId, operation, timestamp',
    })
  }
}

export const db = new NotesDB()
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/db.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/db.ts tests/unit/db.test.ts
git commit -m "feat: add Dexie database schema for notes and sync queue"
```

---

## Task 5: Create Sheets API Client

**Files:**
- Create: `src/lib/notes-api.ts`

**Step 1: Create API client wrapper**

```typescript
import { SheetsDbClient } from 'sheets-db-client'
import type { Note } from './types'

const SHEETS_API_URL = import.meta.env.VITE_SHEETS_API_URL
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID

if (!SHEETS_API_URL || !SPREADSHEET_ID) {
  console.warn('Sheets API not configured - running in offline-only mode')
}

export const sheetsClient = SHEETS_API_URL && SPREADSHEET_ID
  ? new SheetsDbClient({
      baseUrl: SHEETS_API_URL,
      spreadsheetId: SPREADSHEET_ID,
    })
  : null

export const notesSheet = sheetsClient?.sheet<Note>('notes') ?? null

export async function isApiAvailable(): Promise<boolean> {
  if (!sheetsClient) return false
  try {
    await sheetsClient.health()
    return true
  } catch {
    return false
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/notes-api.ts
git commit -m "feat: add Sheets API client wrapper"
```

---

## Task 6: Create Sync Service

**Files:**
- Create: `src/lib/sync.ts`
- Create: `tests/unit/sync.test.ts`

**Step 1: Write failing test for sync queue**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '@/lib/db'
import { queueSync, getPendingCount } from '@/lib/sync'

describe('Sync Service', () => {
  beforeEach(async () => {
    await db.pendingSync.clear()
    await db.notes.clear()
  })

  it('should queue a create operation', async () => {
    const note = {
      id: 'note-1',
      title: 'Test',
      content: 'Content',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await queueSync('create', note)

    const count = await getPendingCount()
    expect(count).toBe(1)
  })

  it('should queue a delete operation', async () => {
    await queueSync('delete', { id: 'note-1' } as any)

    const pending = await db.pendingSync.toArray()
    expect(pending[0].operation).toBe('delete')
    expect(pending[0].noteId).toBe('note-1')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sync.test.ts`
Expected: FAIL - module not found

**Step 3: Create sync.ts**

```typescript
import { v4 as uuid } from 'uuid'
import { db } from './db'
import { notesSheet, isApiAvailable } from './notes-api'
import type { Note, PendingSync } from './types'

export async function queueSync(
  operation: PendingSync['operation'],
  note: Note
): Promise<void> {
  await db.pendingSync.add({
    id: uuid(),
    noteId: note.id,
    operation,
    data: operation !== 'delete' ? note : undefined,
    timestamp: new Date().toISOString(),
  })
}

export async function getPendingCount(): Promise<number> {
  return db.pendingSync.count()
}

export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  if (!notesSheet || !(await isApiAvailable())) {
    return { success: 0, failed: 0 }
  }

  const pending = await db.pendingSync.orderBy('timestamp').toArray()
  let success = 0
  let failed = 0

  for (const item of pending) {
    try {
      if (item.operation === 'create' && item.data) {
        await notesSheet.createRow(item.data)
      } else if (item.operation === 'update' && item.data) {
        const rows = await notesSheet.getRows()
        const rowIndex = rows.findIndex((r) => r.id === item.noteId)
        if (rowIndex >= 0) {
          await notesSheet.updateRow(rowIndex + 2, item.data)
        }
      } else if (item.operation === 'delete') {
        const rows = await notesSheet.getRows()
        const rowIndex = rows.findIndex((r) => r.id === item.noteId)
        if (rowIndex >= 0) {
          await notesSheet.deleteRow(rowIndex + 2)
        }
      }
      await db.pendingSync.delete(item.id)
      success++
    } catch (error) {
      console.error('Sync failed for item:', item.id, error)
      failed++
    }
  }

  return { success, failed }
}

export async function pullFromRemote(): Promise<void> {
  if (!notesSheet || !(await isApiAvailable())) {
    return
  }

  const remoteNotes = await notesSheet.getRows()

  for (const remote of remoteNotes) {
    const local = await db.notes.get(remote.id)
    if (!local || new Date(remote.updatedAt) > new Date(local.updatedAt)) {
      await db.notes.put(remote)
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/sync.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/sync.ts tests/unit/sync.test.ts
git commit -m "feat: add sync service with queue and remote pull"
```

---

## Task 7: Create useNotes Hook

**Files:**
- Create: `src/hooks/use-notes.ts`
- Create: `tests/unit/use-notes.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { useNotes } from '@/hooks/use-notes'
import type { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useNotes', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.pendingSync.clear()
  })

  it('should return empty array initially', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notes).toEqual([])
  })

  it('should create a note', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.createNote({
        title: 'Test Note',
        content: 'Content here',
        tags: 'work',
      })
    })

    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    expect(result.current.notes[0].title).toBe('Test Note')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/use-notes.test.ts`
Expected: FAIL - module not found

**Step 3: Create use-notes.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { db } from '@/lib/db'
import { queueSync } from '@/lib/sync'
import type { Note, SortOrder } from '@/lib/types'

interface CreateNoteInput {
  title: string
  content: string
  tags: string
}

interface UseNotesOptions {
  search?: string
  tagFilter?: string[]
  sortOrder?: SortOrder
}

export function useNotes(options: UseNotesOptions = {}) {
  const queryClient = useQueryClient()
  const { search = '', tagFilter = [], sortOrder = 'newest' } = options

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', search, tagFilter, sortOrder],
    queryFn: async () => {
      let results = await db.notes.toArray()

      if (search) {
        const lower = search.toLowerCase()
        results = results.filter(
          (n) =>
            n.title.toLowerCase().includes(lower) ||
            n.content.toLowerCase().includes(lower)
        )
      }

      if (tagFilter.length > 0) {
        results = results.filter((n) => {
          const noteTags = n.tags.split(',').map((t) => t.trim()).filter(Boolean)
          return tagFilter.some((tag) => noteTags.includes(tag))
        })
      }

      results.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })

      return results
    },
  })

  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const now = new Date().toISOString()
      const note: Note = {
        id: uuid(),
        title: input.title,
        content: input.content,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
      }
      await db.notes.add(note)
      await queueSync('create', note)
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const existing = await db.notes.get(id)
      if (!existing) throw new Error('Note not found')

      const updated: Note = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      await db.notes.put(updated)
      await queueSync('update', updated)
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const note = await db.notes.get(id)
      if (note) {
        await db.notes.delete(id)
        await queueSync('delete', note)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  return {
    notes,
    isLoading,
    createNote: createNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/use-notes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/use-notes.ts tests/unit/use-notes.test.ts
git commit -m "feat: add useNotes hook with CRUD and filtering"
```

---

## Task 8: Create useTags Hook

**Files:**
- Create: `src/hooks/use-tags.ts`

**Step 1: Create use-tags.ts**

```typescript
import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'

export function useTags() {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const notes = await db.notes.toArray()
      const tagSet = new Set<string>()

      for (const note of notes) {
        const noteTags = note.tags.split(',').map((t) => t.trim()).filter(Boolean)
        noteTags.forEach((tag) => tagSet.add(tag))
      }

      return Array.from(tagSet).sort()
    },
  })

  return { tags, isLoading }
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-tags.ts
git commit -m "feat: add useTags hook for tag extraction"
```

---

## Task 9: Create useSync Hook

**Files:**
- Create: `src/hooks/use-sync.ts`

**Step 1: Create use-sync.ts**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPendingCount, processSyncQueue, pullFromRemote } from '@/lib/sync'
import { isApiAvailable } from '@/lib/notes-api'

export function useSync() {
  const queryClient = useQueryClient()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pendingSync'],
    queryFn: getPendingCount,
    refetchInterval: 5000,
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const sync = useCallback(async () => {
    if (isSyncing || !isOnline) return

    const available = await isApiAvailable()
    if (!available) return

    setIsSyncing(true)
    try {
      await processSyncQueue()
      await pullFromRemote()
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['pendingSync'] })
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, isOnline, queryClient])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      sync()
    }
  }, [isOnline, pendingCount, sync])

  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(sync, 30000)
    return () => clearInterval(interval)
  }, [isOnline, sync])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    sync,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-sync.ts
git commit -m "feat: add useSync hook for online status and sync"
```

---

## Task 10: Create TagInput Component

**Files:**
- Create: `src/components/tag-input.tsx`

**Step 1: Create tag-input.tsx**

```typescript
import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTags } from '@/hooks/use-tags'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = 'Add tags...' }: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { tags: allTags } = useTags()

  const suggestions = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(input.toLowerCase()) &&
      !value.includes(tag)
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
    setShowSuggestions(false)
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input) addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-background min-h-[42px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-secondary rounded"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
          {suggestions.slice(0, 5).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/tag-input.tsx
git commit -m "feat: add TagInput component with autocomplete"
```

---

## Task 11: Create NoteForm Component

**Files:**
- Create: `src/components/note-form.tsx`

**Step 1: Create note-form.tsx**

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/tag-input'

interface NoteFormProps {
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<void>
  initialValues?: { title: string; content: string; tags: string[] }
  submitLabel?: string
  onCancel?: () => void
}

export function NoteForm({
  onSubmit,
  initialValues,
  submitLabel = 'Save',
  onCancel,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [content, setContent] = useState(initialValues?.content ?? '')
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags: tags.join(','),
      })
      if (!initialValues) {
        setTitle('')
        setContent('')
        setTags([])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-card">
      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TagInput value={tags} onChange={setTags} />
        </div>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/note-form.tsx
git commit -m "feat: add NoteForm component for create/edit"
```

---

## Task 12: Create NoteCard Component

**Files:**
- Create: `src/components/note-card.tsx`

**Step 1: Create note-card.tsx**

```typescript
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onUpdate: (data: { title: string; content: string; tags: string }) => Promise<void>
  onDelete: () => Promise<void>
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const tags = note.tags.split(',').map((t) => t.trim()).filter(Boolean)
  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <NoteForm
        initialValues={{
          title: note.title,
          content: note.content,
          tags,
        }}
        onSubmit={async (data) => {
          await onUpdate(data)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
        submitLabel="Update"
      />
    )
  }

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{note.title}</h3>
        <span className="text-sm text-muted-foreground whitespace-nowrap">{date}</span>
      </div>
      {note.content && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{note.content}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-secondary rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/note-card.tsx
git commit -m "feat: add NoteCard component with edit/delete"
```

---

## Task 13: Create TagFilter Component

**Files:**
- Create: `src/components/tag-filter.tsx`

**Step 1: Create tag-filter.tsx**

```typescript
import { cn } from '@/lib/utils'
import { useTags } from '@/hooks/use-tags'

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagFilter({ selected, onChange }: TagFilterProps) {
  const { tags } = useTags()

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={cn(
            'px-2 py-1 text-xs rounded-full border transition-colors',
            selected.includes(tag)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/tag-filter.tsx
git commit -m "feat: add TagFilter component"
```

---

## Task 14: Create SyncStatus Component

**Files:**
- Create: `src/components/sync-status.tsx`

**Step 1: Create sync-status.tsx**

```typescript
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const { isOnline, isSyncing, pendingCount, sync } = useSync()

  return (
    <button
      onClick={sync}
      disabled={!isOnline || isSyncing}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors',
        isOnline
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      )}
    >
      {isSyncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {isOnline ? (
        pendingCount > 0 ? `${pendingCount} pending` : 'Synced'
      ) : (
        `Offline${pendingCount > 0 ? ` - ${pendingCount} pending` : ''}`
      )}
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/sync-status.tsx
git commit -m "feat: add SyncStatus component"
```

---

## Task 15: Create Home Page

**Files:**
- Modify: `src/pages/home.tsx`

**Step 1: Update home.tsx**

```typescript
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NoteForm } from '@/components/note-form'
import { NoteCard } from '@/components/note-card'
import { TagFilter } from '@/components/tag-filter'
import { SyncStatus } from '@/components/sync-status'
import { useNotes } from '@/hooks/use-notes'
import type { SortOrder } from '@/lib/types'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes({
    search,
    tagFilter,
    sortOrder,
  })

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <SyncStatus />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TagFilter selected={tagFilter} onChange={setTagFilter} />

      <NoteForm onSubmit={createNote} />

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search || tagFilter.length > 0
              ? 'No notes match your filters'
              : 'No notes yet. Create your first note above!'}
          </p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={(data) => updateNote({ id: note.id, ...data })}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: implement home page with notes list"
```

---

## Task 16: Update App Router

**Files:**
- Modify: `src/App.tsx`

**Step 1: Simplify App.tsx (remove example page)**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
```

**Step 2: Remove unused files**

```bash
rm src/pages/example.tsx src/hooks/use-example.ts src/components/layout/root-layout.tsx
```

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: simplify app to single-page notes UI"
```

---

## Task 17: Update Package Name and Clean Up

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`

**Step 1: Update package.json name**

Change `"name": "react-web-app-template"` to `"name": "notes-app"`

**Step 2: Update CLAUDE.md for notes app context**

Update the description to reflect this is a notes PWA with offline support.

**Step 3: Commit**

```bash
git add package.json CLAUDE.md
git commit -m "chore: rename project to notes-app"
```

---

## Task 18: Test the App

**Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts at http://localhost:5173

**Step 2: Manual testing checklist**

- [ ] Create a new note with title, content, and tags
- [ ] Verify note appears in list
- [ ] Edit a note inline
- [ ] Delete a note
- [ ] Search for a note by title/content
- [ ] Filter by tags
- [ ] Sort by newest/oldest
- [ ] Check sync status indicator
- [ ] Test offline mode (DevTools > Network > Offline)

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit any fixes**

If any issues found, fix and commit.

---

## Task 19: Final PWA Verification

**Step 1: Preview production build**

Run: `npm run preview`

**Step 2: Verify PWA installation**

- Open Chrome DevTools > Application > Manifest
- Check manifest is valid
- Check service worker is registered

**Step 3: Test offline functionality**

- Install PWA to desktop/home screen
- Disconnect network
- Verify app loads and shows cached notes
- Create note while offline
- Reconnect and verify sync

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete PWA setup and verification"
```
