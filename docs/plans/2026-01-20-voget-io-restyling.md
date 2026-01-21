# voget.io Restyling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the Notes app to match the voget.io website design - dark-only theme with animated background effects, JetBrains Mono font, cyan/purple/pink accent colors, and glass-morphism cards.

**Architecture:** Update CSS variables and global styles in `index.css`, add animated background component, remove theme toggle, update all UI components to use the new tech-aesthetic styling with glowing accents and backdrop blur.

**Tech Stack:** React, Tailwind CSS, CSS animations, JetBrains Mono font

---

## Task 1: Add JetBrains Mono Font

**Files:**
- Modify: `index.html`

**Step 1: Add Google Fonts link for JetBrains Mono**

Add to `<head>` section of `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
```

**Step 2: Update theme-color meta tag**

Change from `#F59E0B` to `#0a0e14` (new dark background).

**Step 3: Verify the change**

Run: `npm run dev`
Open browser and verify font loads in Network tab.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add JetBrains Mono font and update theme color"
```

---

## Task 2: Update Global CSS Variables and Base Styles

**Files:**
- Modify: `src/index.css`

**Step 1: Replace entire index.css with voget.io dark theme**

Replace contents of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Tech dark theme - voget.io design system */
    --bg-primary: #0a0e14;
    --bg-secondary: #121821;
    --accent-cyan: #00d4ff;
    --accent-purple: #a78bfa;
    --accent-pink: #ec4899;
    --grid-color: rgba(100, 150, 255, 0.08);
    --particle-color: rgba(167, 139, 250, 0.4);

    --background: 220 50% 4%;
    --foreground: 210 40% 98%;
    --card: 220 40% 7%;
    --card-foreground: 210 40% 98%;
    --primary: 190 100% 50%;
    --primary-foreground: 220 50% 4%;
    --secondary: 220 30% 14%;
    --secondary-foreground: 210 40% 98%;
    --muted: 220 30% 14%;
    --muted-foreground: 215 20% 65%;
    --accent: 263 70% 76%;
    --accent-foreground: 220 50% 4%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 210 40% 98%;
    --border: 220 30% 18%;
    --input: 220 30% 18%;
    --ring: 190 100% 50%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'JetBrains Mono', monospace;
    overflow-x: hidden;
  }
}

/* Animated gradient backdrop */
.gradient-backdrop {
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 20% 50%,
    rgba(0, 212, 255, 0.08) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 80% 50%,
    rgba(167, 139, 250, 0.06) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 50% 50%,
    rgba(236, 72, 153, 0.04) 0%,
    transparent 50%
  );
  animation: gradientShift 20s ease-in-out infinite;
  z-index: 0;
  pointer-events: none;
}

@keyframes gradientShift {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(5%, -5%) rotate(120deg);
  }
  66% {
    transform: translate(-5%, 5%) rotate(240deg);
  }
}

/* Animated grid */
.grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 60px 60px;
  background-position: 0 0, 0 0;
  animation: gridMove 40s linear infinite;
  z-index: 0;
  opacity: 0.6;
  pointer-events: none;
}

@keyframes gridMove {
  0% {
    background-position: 0 0, 0 0;
  }
  100% {
    background-position: 60px 60px, 60px 60px;
  }
}

/* Particle system */
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--particle-color);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--particle-color);
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(var(--particle-drift, 0));
    opacity: 0;
  }
}

/* Scanline effect */
.scanline {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 212, 255, 0.15),
    transparent
  );
  animation: scan 8s linear infinite;
  z-index: 1;
  pointer-events: none;
}

@keyframes scan {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100vh);
  }
}

/* Corner accents */
.corner-accent {
  position: fixed;
  width: 200px;
  height: 200px;
  pointer-events: none;
  z-index: 1;
}

.corner-accent.top-left {
  top: 0;
  left: 0;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  border-left: 1px solid rgba(0, 212, 255, 0.2);
  animation: cornerPulse 4s ease-in-out infinite;
}

.corner-accent.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom: 1px solid rgba(167, 139, 250, 0.2);
  border-right: 1px solid rgba(167, 139, 250, 0.2);
  animation: cornerPulse 4s ease-in-out infinite 2s;
}

@keyframes cornerPulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

/* Tech card styling */
.tech-card {
  background: rgba(18, 24, 33, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 150, 255, 0.2);
  box-shadow:
    0 0 40px rgba(0, 212, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.tech-card:hover {
  border-color: rgba(167, 139, 250, 0.4);
  box-shadow:
    0 0 60px rgba(167, 139, 250, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Glow text effects */
.glow-cyan {
  color: var(--accent-cyan);
  text-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
}

.glow-purple {
  color: var(--accent-purple);
  text-shadow: 0 0 30px rgba(167, 139, 250, 0.3);
}

/* Tech badge */
.tech-badge {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: var(--accent-cyan);
}

/* Tech input styling */
.tech-input {
  background: rgba(18, 24, 33, 0.5);
  border: 1px solid rgba(100, 150, 255, 0.2);
  transition: all 0.3s ease;
}

.tech-input:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
  outline: none;
}

/* Tech button variants */
.tech-button-primary {
  background: var(--accent-cyan);
  color: #0a0e14;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tech-button-primary:hover {
  background: rgba(0, 212, 255, 0.8);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.tech-button-secondary {
  background: transparent;
  border: 1px solid rgba(167, 139, 250, 0.5);
  color: var(--accent-purple);
  transition: all 0.3s ease;
}

.tech-button-secondary:hover {
  border-color: var(--accent-purple);
  background: rgba(167, 139, 250, 0.1);
}

.tech-button-ghost {
  background: transparent;
  color: hsl(var(--muted-foreground));
  transition: all 0.3s ease;
}

.tech-button-ghost:hover {
  color: var(--accent-cyan);
  background: rgba(0, 212, 255, 0.1);
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Browser should show dark background with new colors.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add voget.io dark theme and animated background styles"
```

---

## Task 3: Create Animated Background Component

**Files:**
- Create: `src/components/animated-background.tsx`

**Step 1: Create the animated background component**

Create `src/components/animated-background.tsx`:

```tsx
import { useEffect } from 'react'

function Particles() {
  useEffect(() => {
    const container = document.getElementById('particles')
    if (!container || container.children.length > 0) return

    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.top = Math.random() * 100 + '%'
      const duration = 15 + Math.random() * 25
      particle.style.animationDuration = duration + 's'
      particle.style.animationDelay = Math.random() * 10 + 's'
      const drift = (Math.random() - 0.5) * 100
      particle.style.setProperty('--particle-drift', drift + 'px')
      const size = 1 + Math.random() * 2
      particle.style.width = size + 'px'
      particle.style.height = size + 'px'
      container.appendChild(particle)
    }
  }, [])

  return <div className="particles" id="particles" />
}

export function AnimatedBackground() {
  return (
    <>
      <div className="gradient-backdrop" />
      <div className="grid-overlay" />
      <Particles />
      <div className="scanline" />
      <div className="corner-accent top-left" />
      <div className="corner-accent bottom-right" />
    </>
  )
}
```

**Step 2: Verify the change**

Run: `npm run build`
Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add src/components/animated-background.tsx
git commit -m "feat: add animated background component"
```

---

## Task 4: Remove Theme Toggle and Hook

**Files:**
- Delete: `src/components/theme-toggle.tsx`
- Modify: `src/hooks/use-theme.ts` (delete if exists, or simplify)
- Modify: `src/pages/home.tsx`

**Step 1: Check if use-theme hook exists and remove theme logic**

First, check: `src/hooks/use-theme.ts`

If it exists, delete it or simplify to just ensure dark class is always set.

**Step 2: Remove ThemeToggle from home.tsx**

In `src/pages/home.tsx`, remove:
- The import: `import { ThemeToggle } from '@/components/theme-toggle'`
- The component: `<ThemeToggle />`

**Step 3: Delete theme-toggle.tsx**

Delete `src/components/theme-toggle.tsx`

**Step 4: Ensure dark class is always on html element**

In `src/main.tsx` or `src/App.tsx`, add at the top level:

```tsx
// Ensure dark mode is always enabled
document.documentElement.classList.add('dark')
```

**Step 5: Verify the change**

Run: `npm run build`
Expected: No TypeScript errors about missing ThemeToggle.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove theme toggle, set permanent dark mode"
```

---

## Task 5: Update App.tsx with Animated Background

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add AnimatedBackground to App.tsx**

Update `src/App.tsx`:

```tsx
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home'
import { SheetsSetupWizard } from '@/components/sheets'
import { AnimatedBackground } from '@/components/animated-background'
import { useSettings } from '@/hooks/use-settings'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

// Ensure dark mode is always enabled
document.documentElement.classList.add('dark')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppContent() {
  const { spreadsheetId, connectSpreadsheet, isInitializing } = useSettings()
  const [inputValue, setInputValue] = useState('')

  const handleConnect = async () => {
    await connectSpreadsheet(inputValue)
  }

  if (!spreadsheetId) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <SheetsSetupWizard
            serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onConnect={handleConnect}
            isConnecting={isInitializing}
            title="Notes Setup"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Animated background visible behind content.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate animated background into app layout"
```

---

## Task 6: Update Home Page Header Styling

**Files:**
- Modify: `src/pages/home.tsx`

**Step 1: Update home.tsx with new styling**

Update header and layout in `src/pages/home.tsx`:

```tsx
import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NoteForm } from '@/components/note-form'
import { NoteCard } from '@/components/note-card'
import { TagFilter } from '@/components/tag-filter'
import { SyncStatus } from '@/components/sync-status'
import { SettingsDialog } from '@/components/settings-dialog'
import { useNotes } from '@/hooks/use-notes'
import { useSettings } from '@/hooks/use-settings'
import type { SortOrder } from '@/lib/types'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const {
    spreadsheetId,
    connectSpreadsheet,
    isInitializing,
    status,
    anthropicApiKey,
    setAnthropicApiKey,
    clearAnthropicApiKey,
  } = useSettings()

  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes({
    search,
    tagFilter,
    sortOrder,
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: notes.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
    getItemKey: (index) => notes[index]?.id ?? index,
  })

  return (
    <div className="h-screen flex flex-col max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="glow-cyan">Notes</span>
        </h1>
        <div className="flex items-center gap-2">
          <SyncStatus />
          <SettingsDialog
            spreadsheetId={spreadsheetId}
            onSave={connectSpreadsheet}
            isSaving={isInitializing}
            status={status}
            anthropicApiKey={anthropicApiKey}
            onSaveApiKey={setAnthropicApiKey}
            onClearApiKey={clearAnthropicApiKey}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
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

      <div className="mb-4">
        <TagFilter selected={tagFilter} onChange={setTagFilter} />
      </div>

      <div className="mb-4">
        <NoteForm onSubmit={createNote} />
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-center text-muted-foreground font-light">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-light">
            {search || tagFilter.length > 0
              ? 'No notes match your filters'
              : 'No notes yet. Create your first note above!'}
          </p>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="pb-3">
                  <NoteCard
                    note={notes[virtualRow.index]}
                    onUpdate={(data) => updateNote({ id: notes[virtualRow.index].id, ...data })}
                    onDelete={() => deleteNote(notes[virtualRow.index].id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Header shows glowing cyan "Notes" title.

**Step 3: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: update home page with voget.io styling"
```

---

## Task 7: Update Input Component with Tech Styling

**Files:**
- Modify: `src/components/ui/input.tsx`

**Step 1: Update Input component**

Update `src/components/ui/input.tsx`:

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Inputs have dark glass effect with cyan glow on focus.

**Step 3: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "feat: update input component with tech styling"
```

---

## Task 8: Update Button Component with Tech Variants

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Update Button component**

Update `src/components/ui/button.tsx`:

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-cyan)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-cyan)] text-[#0a0e14] hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]',
        destructive: 'bg-destructive/80 text-destructive-foreground hover:bg-destructive hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        outline: 'border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] bg-transparent hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-muted-foreground hover:text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.1)]',
        link: 'text-[var(--accent-cyan)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Buttons show cyan primary, purple outline variants with glow effects.

**Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: update button component with tech styling"
```

---

## Task 9: Update Card Component with Glass Morphism

**Files:**
- Modify: `src/components/ui/card.tsx`

**Step 1: Update Card component**

Update `src/components/ui/card.tsx`:

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl text-card-foreground bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-[rgba(167,139,250,0.4)] hover:shadow-[0_0_60px_rgba(167,139,250,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground font-light', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Cards show glass morphism effect with purple glow on hover.

**Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: update card component with glass morphism"
```

---

## Task 10: Update NoteCard with Tech Styling

**Files:**
- Modify: `src/components/note-card.tsx`

**Step 1: Update NoteCard component**

Update `src/components/note-card.tsx`:

```tsx
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'
import type { Note } from '@/lib/types'

interface NoteCardProps {
  note: Note
  onUpdate: (data: { title: string; content: string; tags: string }) => Promise<unknown>
  onDelete: () => Promise<unknown>
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

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
    <div className="p-4 rounded-xl bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-[rgba(167,139,250,0.4)] hover:shadow-[0_0_60px_rgba(167,139,250,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground">{note.title}</h3>
        <span className="text-sm text-muted-foreground whitespace-nowrap font-light">{date}</span>
      </div>
      {note.content && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 font-light">{note.content}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]"
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
            className="hover:text-[var(--accent-cyan)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:text-[var(--accent-pink)] hover:bg-[rgba(236,72,153,0.1)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Note cards have glass effect, cyan tags, hover glow.

**Step 3: Commit**

```bash
git add src/components/note-card.tsx
git commit -m "feat: update note card with tech styling"
```

---

## Task 11: Update NoteForm with Tech Styling

**Files:**
- Modify: `src/components/note-form.tsx`

**Step 1: Update NoteForm component**

Update `src/components/note-form.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/tag-input'
import { useVoiceRecording } from '@/hooks/use-voice-recording'

interface NoteFormProps {
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<unknown>
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
  const [formKey, setFormKey] = useState(0)
  const pendingTagRef = useRef('')

  const { isListening, transcript, error: voiceError, isSupported, startListening, stopListening, resetTranscript } = useVoiceRecording()

  useEffect(() => {
    if (transcript) {
      setContent(prev => {
        const newContent = prev ? `${prev} ${transcript}` : transcript
        return newContent
      })
      resetTranscript()
    }
  }, [transcript, resetTranscript])

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return

    if (isListening) {
      stopListening()
    }

    let finalTags = [...tags]
    const pendingTag = pendingTagRef.current.trim().toLowerCase()
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag)
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags: finalTags.join(','),
      })
      if (!initialValues) {
        setTitle('')
        setContent('')
        setTags([])
        pendingTagRef.current = ''
        resetTranscript()
        setFormKey((k) => k + 1)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="relative">
        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 pr-12 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-foreground text-sm resize-none focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] placeholder:text-muted-foreground transition-all duration-300"
        />
        {isSupported && (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "default" : "ghost"}
            onClick={toggleVoiceRecording}
            className="absolute right-2 top-2"
            title={isListening ? "Stop recording" : "Start voice recording"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {voiceError && (
        <p className="text-sm text-[var(--accent-pink)]">{voiceError}</p>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TagInput key={formKey} value={tags} onChange={setTags} pendingInputRef={pendingTagRef} />
        </div>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || (!title.trim() && !content.trim())}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Note form has glass morphism styling.

**Step 3: Commit**

```bash
git add src/components/note-form.tsx
git commit -m "feat: update note form with tech styling"
```

---

## Task 12: Update Select Component with Tech Styling

**Files:**
- Modify: `src/components/ui/select.tsx`

**Step 1: Update Select component**

Update `src/components/ui/select.tsx`:

```tsx
import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-300',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg bg-[rgba(18,24,33,0.95)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] text-foreground shadow-[0_0_40px_rgba(0,212,255,0.1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-[rgba(0,212,255,0.1)] focus:text-[var(--accent-cyan)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--accent-cyan)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Select dropdowns have glass effect with cyan highlights.

**Step 3: Commit**

```bash
git add src/components/ui/select.tsx
git commit -m "feat: update select component with tech styling"
```

---

## Task 13: Update Dialog Component with Tech Styling

**Files:**
- Modify: `src/components/ui/dialog.tsx`

**Step 1: Update Dialog component**

Update `src/components/ui/dialog.tsx`:

```tsx
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-[rgba(18,24,33,0.95)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] p-6 shadow-[0_0_60px_rgba(0,212,255,0.1)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-all hover:text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.1)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground font-light', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Dialog modal has glass morphism with cyan glow.

**Step 3: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "feat: update dialog component with tech styling"
```

---

## Task 14: Update SyncStatus with Tech Badge Styling

**Files:**
- Modify: `src/components/sync-status.tsx`

**Step 1: Update SyncStatus component**

Update `src/components/sync-status.tsx`:

```tsx
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
        'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 border',
        isOnline
          ? 'bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)] border-[rgba(0,212,255,0.2)] hover:border-[var(--accent-cyan)] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]'
          : 'bg-[rgba(167,139,250,0.1)] text-[var(--accent-purple)] border-[rgba(167,139,250,0.2)]'
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

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Sync status shows cyan when online, purple when offline.

**Step 3: Commit**

```bash
git add src/components/sync-status.tsx
git commit -m "feat: update sync status with tech badge styling"
```

---

## Task 15: Update TagFilter with Tech Styling

**Files:**
- Modify: `src/components/tag-filter.tsx`

**Step 1: Update TagFilter component**

Update `src/components/tag-filter.tsx`:

```tsx
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
    <div className="flex gap-1 overflow-x-auto pb-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={cn(
            'px-3 py-1 text-xs rounded-lg border transition-all duration-300',
            selected.includes(tag)
              ? 'bg-[var(--accent-cyan)] text-[#0a0e14] border-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,212,255,0.3)]'
              : 'bg-[rgba(18,24,33,0.5)] text-muted-foreground border-[rgba(100,150,255,0.2)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Tags have glass effect, glow cyan when selected.

**Step 3: Commit**

```bash
git add src/components/tag-filter.tsx
git commit -m "feat: update tag filter with tech styling"
```

---

## Task 16: Update TagInput with Tech Styling

**Files:**
- Modify: `src/components/tag-input.tsx`

**Step 1: Update TagInput component**

Update `src/components/tag-input.tsx`:

```tsx
import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { useTags } from '@/hooks/use-tags'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  pendingInputRef?: React.MutableRefObject<string>
}

export function TagInput({ value, onChange, placeholder = 'Add tags...', pendingInputRef }: TagInputProps) {
  const [input, setInput] = useState('')

  if (pendingInputRef) {
    pendingInputRef.current = input
  }
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
      <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] min-h-[42px] focus-within:border-[var(--accent-cyan)] focus-within:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-sm rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-[var(--accent-pink)] transition-colors"
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
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[rgba(18,24,33,0.95)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] rounded-lg shadow-[0_0_40px_rgba(0,212,255,0.1)]">
          {suggestions.slice(0, 5).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-[rgba(0,212,255,0.1)] hover:text-[var(--accent-cyan)] transition-colors first:rounded-t-lg last:rounded-b-lg"
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

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Tag input has glass effect with cyan-styled tags.

**Step 3: Commit**

```bash
git add src/components/tag-input.tsx
git commit -m "feat: update tag input with tech styling"
```

---

## Task 17: Update Settings Panels with Tech Styling

**Files:**
- Modify: `src/components/sheets/SheetsSetupWizard.tsx`
- Modify: `src/components/sheets/SheetsSettingsPanel.tsx`
- Modify: `src/components/anthropic/AnthropicSettingsPanel.tsx`

**Step 1: Update SheetsSetupWizard**

Update `src/components/sheets/SheetsSetupWizard.tsx`:

```tsx
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
    <div className="mb-6 p-6 bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] rounded-xl shadow-[0_0_40px_rgba(0,212,255,0.05)]">
      <p className="text-base text-foreground font-semibold mb-4">
        <span className="glow-cyan">{title}</span>
      </p>
      <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground font-light">
        <li>Create a new Google Sheet</li>
        <li>
          Share it with:
          <br />
          <code className="block mt-2 p-3 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg text-xs break-all select-all text-[var(--accent-cyan)]">
            {serviceAccountEmail}
          </code>
          <span className="text-muted-foreground">(Editor access)</span>
        </li>
        <li>Copy the Sheet ID from the URL</li>
        <li>Paste below and click "{connectButtonText}"</li>
      </ol>
      {additionalInstructions && (
        <div className="mt-4 text-sm text-muted-foreground font-light">
          {additionalInstructions}
        </div>
      )}
      <div className="mt-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          className="w-full px-4 py-3 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300"
        />
        <button
          type="button"
          onClick={handleConnect}
          disabled={!inputValue || isConnecting}
          className="w-full mt-3 px-4 py-3 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg text-sm font-medium hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isConnecting ? connectingButtonText : connectButtonText}
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Update SheetsSettingsPanel**

Update `src/components/sheets/SheetsSettingsPanel.tsx`:

```tsx
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
          <p className="text-sm font-medium text-foreground">Change Spreadsheet</p>
          <p className="text-xs text-muted-foreground font-light">
            Make sure to share the new spreadsheet with:
            <br />
            <code className="block mt-2 p-3 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg text-xs break-all select-all text-[var(--accent-cyan)]">
              {serviceAccountEmail}
            </code>
          </p>
          <div>
            <input
              type="text"
              value={tempInputValue}
              onChange={(e) => onTempInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-4 py-3 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300"
            />
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
              disabled={isSaving || !tempInputValue}
              className="flex-1 px-4 py-3 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? savingButtonText : saveButtonText}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg">
            <p className="text-sm text-[var(--accent-cyan)] font-medium mb-2">
              {connectedText}
            </p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent-purple)] hover:text-[var(--accent-cyan)] underline break-all transition-colors"
            >
              Open Spreadsheet
            </a>
          </div>
          <button
            type="button"
            onClick={handleStartEditing}
            className="w-full px-4 py-3 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm font-medium"
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
    ? 'bg-[rgba(236,72,153,0.1)] text-[var(--accent-pink)] border border-[rgba(236,72,153,0.2)]'
    : isSuccess
      ? 'bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)] border border-[rgba(0,212,255,0.2)]'
      : 'bg-[rgba(167,139,250,0.1)] text-[var(--accent-purple)] border border-[rgba(167,139,250,0.2)]'

  return <div className={`p-3 rounded-lg text-sm font-medium ${bgColor}`}>{status}</div>
}
```

**Step 3: Update AnthropicSettingsPanel**

Update `src/components/anthropic/AnthropicSettingsPanel.tsx`:

```tsx
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
```

**Step 4: Verify the change**

Run: `npm run dev`
Expected: Settings panels have consistent tech styling with cyan/purple/pink accents.

**Step 5: Commit**

```bash
git add src/components/sheets/SheetsSetupWizard.tsx src/components/sheets/SheetsSettingsPanel.tsx src/components/anthropic/AnthropicSettingsPanel.tsx
git commit -m "feat: update settings panels with tech styling"
```

---

## Task 18: Update Settings Dialog Header Styling

**Files:**
- Modify: `src/components/settings-dialog.tsx`

**Step 1: Update SettingsDialog**

Update `src/components/settings-dialog.tsx`:

```tsx
import { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SheetsSettingsPanel } from '@/components/sheets'
import { AnthropicSettingsPanel } from '@/components/anthropic'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

interface SettingsDialogProps {
  spreadsheetId: string
  onSave: (newId: string) => Promise<boolean>
  isSaving: boolean
  status: string
  anthropicApiKey: string
  onSaveApiKey: (key: string) => void
  onClearApiKey: () => void
}

export function SettingsDialog({
  spreadsheetId,
  onSave,
  isSaving,
  status,
  anthropicApiKey,
  onSaveApiKey,
  onClearApiKey,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempId, setTempId] = useState('')

  const handleSave = async () => {
    const success = await onSave(tempId)
    if (success) {
      setIsEditing(false)
      setTempId('')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsEditing(false)
      setTempId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="glow-purple">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-cyan)]">Google Sheets Sync</h3>
            <SheetsSettingsPanel
              serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
              spreadsheetId={spreadsheetId}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
              tempInputValue={tempId}
              onTempInputChange={setTempId}
              onSave={handleSave}
              isSaving={isSaving}
              status={status}
            />
          </div>
          <div className="border-t border-[rgba(100,150,255,0.2)] pt-6">
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-purple)]">AI Auto-Generation</h3>
            <AnthropicSettingsPanel
              apiKey={anthropicApiKey}
              onSave={onSaveApiKey}
              onClear={onClearApiKey}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify the change**

Run: `npm run dev`
Expected: Settings dialog has glowing title and colored section headers.

**Step 3: Commit**

```bash
git add src/components/settings-dialog.tsx
git commit -m "feat: update settings dialog with tech styling"
```

---

## Task 19: Run Tests and Build

**Files:** None (verification only)

**Step 1: Run lint**

Run: `npm run lint`
Expected: No errors or warnings.

**Step 2: Run tests**

Run: `npm run test`
Expected: All tests pass.

**Step 3: Run build**

Run: `npm run build`
Expected: Build completes successfully.

**Step 4: Preview production build**

Run: `npm run preview`
Expected: App loads with new styling, animated background visible.

**Step 5: Commit any fixes if needed**

If there are any issues, fix them and commit.

---

## Task 20: Final Commit and Cleanup

**Files:** None

**Step 1: Check git status**

Run: `git status`
Expected: Clean working directory or minor uncommitted changes.

**Step 2: Create final summary commit if needed**

If there are any remaining changes:

```bash
git add -A
git commit -m "chore: finalize voget.io restyling"
```

**Step 3: Verify all changes are committed**

Run: `git log --oneline -10`
Expected: See all styling commits.

---

## Summary

This plan restyles the Notes app to match voget.io with:
- JetBrains Mono font
- Dark-only theme with animated backgrounds (gradient, grid, particles, scanline, corner accents)
- Cyan/purple/pink accent colors
- Glass morphism cards with backdrop blur
- Glowing text effects and button hover states
- Consistent tech-aesthetic styling across all components
