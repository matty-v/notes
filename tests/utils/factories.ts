import type { Note } from '@/lib/types'

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
    sourceId: 'test-source',
    title: 'Test Note',
    content: 'Test content',
    tags: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Resets the ID counter. Useful in beforeEach hooks for consistent IDs.
 */
export function resetIdCounter(): void {
  noteIdCounter = 1
}
