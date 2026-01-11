# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture Overview

React SPA with TypeScript, built with Vite. Uses Tailwind CSS for styling with CSS variables for theming.

### Directory Structure

```
src/
  components/
    ui/              # Radix + CVA primitives (Button, Input, etc.)
    layout/          # Layout components (RootLayout)
  hooks/             # TanStack Query hooks
  lib/
    api.ts           # REST API client
    utils.ts         # Utilities (cn helper)
  pages/             # Route components
  App.tsx            # Router setup + QueryClient
  main.tsx           # Entry point
  index.css          # Tailwind + theme variables
```

### Key Patterns

- **Components**: Radix UI primitives + CVA for variants
- **Styling**: Tailwind with HSL CSS variables for theming
- **Data Fetching**: TanStack Query with typed API client
- **Routing**: React Router v6 with layout routes

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

## Adding New API Hooks

Follow the pattern in `src/hooks/use-example.ts`:

```typescript
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => api.get<Item[]>('/items'),
  })
}
```

## Development Workflow (TDD)

1. **Write failing test first** in `tests/unit/` or `tests/e2e/`
2. **Run test** to confirm it fails
3. **Implement minimal code** to make test pass
4. **Refactor** while keeping tests green
5. **Commit** with descriptive message

## Testing

- Unit tests: `npm test` (Vitest)
- E2E tests: `npm run test:e2e` (Playwright)

## Path Alias

`@/` maps to `./src/` in imports.

## Theming

CSS variables in `src/index.css`. Toggle dark mode by adding `dark` class to `<html>`.
