# Notes PWA Design

A Progressive Web App for quickly creating and viewing notes, backed by Google Sheets via the sheets-db-api.

## Requirements

- Quick note creation via inline form
- View notes as cards with title, content preview, tags, and date
- Freeform tags with autocomplete from existing tags
- Search notes by title/content
- Filter by tags
- Sort by newest/oldest
- Edit and delete notes
- Full offline support with sync when reconnected
- Last-write-wins conflict resolution

## Data Model

A `notes` sheet in Google Sheets:

| Column | Type | Description |
|--------|------|-------------|
| `id` | string | UUID generated client-side |
| `title` | string | Note title |
| `content` | string | Note body text |
| `tags` | string | Comma-separated tags |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

The `id` field enables tracking notes across offline/online sync since row indices can shift.

## Offline Architecture

### Storage Layers

- **IndexedDB** (via Dexie.js): Primary local database for notes and sync queue
- **Service Worker**: Caches app shell and assets for offline access

### Sync Strategy

1. All changes write to IndexedDB first (immediate, works offline)
2. Changes queue in a "pending sync" table with operation type and timestamp
3. When online, sync worker pushes pending changes to Sheets API
4. On sync success, remove items from pending queue
5. Periodically pull full dataset from API, merge using `updatedAt` (last write wins)

### Conflict Resolution

- Compare local `updatedAt` vs remote `updatedAt`
- Keep whichever is newer
- If remote is newer, update local; if local is newer, push to remote

### Online Detection

- Use `navigator.onLine` + periodic health check to the API
- Show sync status indicator in the UI

## UI Layout

```
┌─────────────────────────────────────────┐
│  [Search input]        [Sort: ▼ Newest] │
│  [Tag filters: work | personal | ...]   │
├─────────────────────────────────────────┤
│  ┌─ New Note ─────────────────────────┐ │
│  │ Title: [____________]              │ │
│  │ Content: [__________________]      │ │
│  │ Tags: [tag1, tag2, +]    [Save]    │ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  ┌─ Note Card ────────────────────────┐ │
│  │ Meeting notes           Jan 11     │ │
│  │ Discussed the project timeline...  │ │
│  │ [work] [meetings]      [Edit] [×]  │ │
│  └────────────────────────────────────┘ │
│  ┌─ Note Card ────────────────────────┐ │
│  │ ...                                │ │
└─────────────────────────────────────────┘
         [● Synced] or [○ Offline - 3 pending]
```

### Interactions

- Search filters notes by title and content
- Clicking a tag in filters toggles it on/off
- Sort dropdown toggles between newest/oldest first
- Edit opens inline editing within the card
- Tag input autocompletes from existing tags
- Status bar shows sync state and pending count

## Technical Stack

### From Template (react-web-app)

- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI + CVA
- TanStack Query
- React Router v6

### Additional Dependencies

- **dexie**: IndexedDB wrapper for local storage
- **sheets-db-client**: SDK for the Sheets API (from ../sheets-db-api/sdk)
- **vite-plugin-pwa**: Service worker generation and PWA manifest
- **uuid**: Generate unique note IDs

## File Structure

```
src/
  lib/
    db.ts              # Dexie database schema (notes, pendingSync tables)
    sync.ts            # Sync logic (push/pull/merge)
    notes-api.ts       # Sheets API client setup
  hooks/
    use-notes.ts       # CRUD operations (reads from IndexedDB)
    use-tags.ts        # Tag list and autocomplete
    use-sync.ts        # Sync status and trigger
  components/
    note-form.tsx      # Inline create/edit form
    note-card.tsx      # Note display card
    tag-input.tsx      # Tag input with autocomplete
    tag-filter.tsx     # Clickable tag filters
    search-bar.tsx     # Search input
    sort-select.tsx    # Sort dropdown
    sync-status.tsx    # Sync indicator
  pages/
    home.tsx           # Main notes page (single page app)
```

## Configuration

Environment variables:

- `VITE_SHEETS_API_URL`: The Sheets API endpoint
- `VITE_SPREADSHEET_ID`: Google Sheets spreadsheet ID for notes storage

## Setup Requirements

1. Create a Google Sheet for notes storage
2. Share the sheet with the sheets-db-api service account
3. Configure environment variables with the spreadsheet ID
