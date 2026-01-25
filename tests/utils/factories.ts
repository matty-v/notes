import type { Note, PendingSync } from '@/lib/types'

let noteIdCounter = 1

/**
 * Creates a mock Note object with sensible defaults.
 * All fields use correct types as defined in the Note interface.
 *
 * @param overrides - Partial Note object to override defaults
 * @returns A complete Note object
 */
export function createMockNote(overrides?: Partial<Note>): Note {
  const id = String(noteIdCounter++)
  const now = new Date().toISOString()

  return {
    id,
    title: 'Test Note',
    content: 'Test content',
    tags: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Creates a mock PendingSync object with sensible defaults.
 *
 * @param overrides - Partial PendingSync object to override defaults
 * @returns A complete PendingSync object
 */
export function createMockPendingSync(overrides?: Partial<PendingSync>): PendingSync {
  const id = String(noteIdCounter++)
  const now = new Date().toISOString()

  return {
    id,
    noteId: '1',
    operation: 'create',
    timestamp: now,
    ...overrides,
  }
}

/**
 * Resets the ID counter. Useful in beforeEach hooks for consistent IDs.
 */
export function resetIdCounter(): void {
  noteIdCounter = 1
}
