# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Notes App is a Progressive Web Application (PWA) for creating and managing notes with full offline support. Built with React, TypeScript, and Vite, it uses IndexedDB (via Dexie) for local storage and syncs with a Google Sheets backend via SheetsDbClient when online.

## Build and Development Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally
npm run test         # Run Vitest unit tests
npm run test:watch   # Run Vitest in watch mode
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright with UI
npm run lint         # ESLint check
npm run deploy       # Build and deploy to Firebase
```

Run a single unit test file:
```bash
npx vitest run tests/unit/db.test.ts
```

Run a single E2E test:
```bash
npx playwright test tests/e2e/home.spec.ts
```

## Architecture Overview

### Offline-First Data Flow

```
User Action → useNotes hook → IndexedDB (immediate) → queueSync → pendingSync table
                                                                        ↓
                                                              processSyncQueue (when online)
                                                                        ↓
                                                              SheetsDbClient → Google Sheets API
```

1. **Local-first writes**: All CRUD operations write to IndexedDB immediately via `db.notes`
2. **Sync queue**: Operations are queued in `db.pendingSync` table for later sync
3. **Background sync**: `processSyncQueue()` in `src/lib/sync.ts` pushes pending changes when online
4. **Pull on load**: `pullFromRemote()` fetches remote changes on app load, merging by `updatedAt` timestamp

### Key Files

- `src/lib/db.ts` - Dexie database schema with `notes` and `pendingSync` tables
- `src/lib/sync.ts` - Sync queue logic: `queueSync`, `processSyncQueue`, `pullFromRemote`
- `src/lib/notes-api.ts` - SheetsDbClient initialization and availability checks
- `src/hooks/use-notes.ts` - TanStack Query hook wrapping all note operations
- `src/services/sheetsdb/SheetsDbClient.ts` - HTTP client for Google Sheets proxy API

### Directory Structure

```
src/
  components/
    ui/              # Radix + CVA primitives (Button, Input, etc.)
    sheets/          # Google Sheets setup wizard and settings
  hooks/             # TanStack Query hooks (use-notes, use-sync, use-tags, etc.)
  lib/
    db.ts            # Dexie IndexedDB schema
    sync.ts          # Offline sync queue logic
    notes-api.ts     # SheetsDb client setup
    types.ts         # Shared TypeScript types (Note, PendingSync, etc.)
  services/sheetsdb/ # SheetsDbClient for Google Sheets API proxy
  pages/             # Route components
```

### Key Patterns

- **Components**: Radix UI primitives + CVA for variants
- **Styling**: Tailwind with HSL CSS variables for theming
- **Data Fetching**: TanStack Query with IndexedDB as primary source
- **Routing**: React Router v6

## Adding New Components

Follow the CVA pattern in `src/components/ui/button.tsx`:

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const componentVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', secondary: '...' },
    size: { default: '...', sm: '...' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})
```

## Testing

Unit tests use `fake-indexeddb` for IndexedDB mocking (auto-imported in `tests/unit/setup.ts`).

Clear database state in `beforeEach`:
```typescript
beforeEach(async () => {
  await db.notes.clear()
  await db.pendingSync.clear()
})
```

## Path Alias

`@/` maps to `./src/` in imports.

## Theming

CSS variables in `src/index.css`. Toggle dark mode by adding `dark` class to `<html>`.
