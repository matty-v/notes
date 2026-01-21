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
User Action → useNotes hook → Auto-generate (if empty) → IndexedDB (immediate) → queueSync → pendingSync table
                                     ↓                                                          ↓
                               Claude API                                          processSyncQueue (when online)
                                                                                              ↓
                                                                                    SheetsDbClient → Google Sheets API
```

1. **Local-first writes**: All CRUD operations write to IndexedDB immediately via `db.notes`
2. **Auto-generation**: Title and tags are auto-generated using Claude API when empty (see `src/services/claude/generateMetadata.ts`). Users can configure their Anthropic API key via Settings UI (stored in localStorage).
3. **Sync queue**: Operations are queued in `db.pendingSync` table for later sync
4. **Background sync**: `processSyncQueue()` in `src/lib/sync.ts` pushes pending changes when online
5. **Pull on load**: `pullFromRemote()` fetches remote changes on app load, merging by `updatedAt` timestamp

### Key Files

- `src/lib/db.ts` - Dexie database schema with `notes` and `pendingSync` tables
- `src/lib/sync.ts` - Sync queue logic: `queueSync`, `processSyncQueue`, `pullFromRemote`
- `src/lib/notes-api.ts` - SheetsDbClient initialization and availability checks
- `src/hooks/use-notes.ts` - TanStack Query hook wrapping all note operations with auto-generation
- `src/services/claude/generateMetadata.ts` - Claude API integration for title/tag generation
- `src/services/sheetsdb/SheetsDbClient.ts` - HTTP client for Google Sheets proxy API

### Directory Structure

```
src/
  components/
    ui/              # Radix + CVA primitives (Button, Input, etc.)
    sheets/          # Google Sheets setup wizard and settings
    anthropic/       # Anthropic API key settings panel
  hooks/             # TanStack Query hooks (use-notes, use-sync, use-tags, etc.)
  lib/
    db.ts            # Dexie IndexedDB schema
    sync.ts          # Offline sync queue logic
    notes-api.ts     # SheetsDb client setup
    types.ts         # Shared TypeScript types (Note, PendingSync, etc.)
  services/
    claude/          # Claude API integration for auto-generation
    sheetsdb/        # SheetsDbClient for Google Sheets API proxy
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

### File Extensions for Tests

**CRITICAL**: Test files containing JSX syntax MUST use `.tsx` extension, not `.ts`.

- ✅ Use `.tsx` for test files that render React components or use JSX syntax
- ✅ Use `.ts` for test files with no JSX (e.g., pure function tests)
- ❌ Never use `.ts` for files containing `<ComponentName>` JSX syntax

Example:
```typescript
// ❌ WRONG: use-notes.test.ts
return <QueryClientProvider>{children}</QueryClientProvider>  // JSX in .ts file

// ✅ CORRECT: use-notes.test.tsx
return <QueryClientProvider>{children}</QueryClientProvider>  // JSX in .tsx file
```

Before creating a new test file with React Testing Library or JSX, always use the `.tsx` extension.

## Path Alias

`@/` maps to `./src/` in imports.

## Theming

CSS variables in `src/index.css`. Toggle dark mode by adding `dark` class to `<html>`.

## Code Style

- **Prefer functional components** with hooks over class components
- **Use TypeScript strict mode** - avoid `any` types, prefer explicit typing
- **Async/await** over raw promises for readability
- **Early returns** to reduce nesting
- **Destructure props** in function signatures

```typescript
// ✅ Good
const NoteCard = ({ title, content, onDelete }: NoteCardProps) => {
  if (!title) return null
  // ...
}

// ❌ Avoid
function NoteCard(props: any) {
  if (props.title) {
    // nested logic...
  }
}
```

## PR Guidelines

- **Keep PRs focused** - one feature or fix per PR
- **Update tests** for any behavior changes
- **Run `npm run lint` and `npm run test`** before submitting
- **Include a clear description** of what changed and why
- **Update documentation** for user-facing changes
- **Squash fixup commits** before merging

## Security Notes

- **Never commit secrets** - API keys, tokens, or credentials belong in environment variables or secrets managers
- **Validate user input** - especially note content before any processing
- **Sanitize displayed content** - prevent XSS when rendering note content
- **Use HTTPS** for all external API calls (SheetsDbClient, Claude API)
- **LocalStorage limitations** - API keys stored in localStorage are accessible to any script; this is acceptable for personal use but not for shared deployments

## Review Checklist

When reviewing PRs (for Claude or humans):

- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors or `any` types introduced
- [ ] Error handling for async operations
- [ ] Loading states for UI components that fetch data
- [ ] Offline behavior considered (IndexedDB operations should work offline)
- [ ] No sensitive data logged or exposed
- [ ] Documentation updated if needed
