import type { Note, PendingSync } from '@/lib/types'

/**
 * Creates a mock Note object with type-safe defaults.
 * Useful for testing to ensure correct types are used (e.g., ISO date strings instead of numbers).
 *
 * @param overrides - Partial Note object to override default values
 * @returns A complete Note object with all required fields
 *
 * @example
 * const note = createMockNote({ title: 'Custom Title' })
 */
export function createMockNote(overrides?: Partial<Note>): Note {
  const now = new Date().toISOString()
  return {
    id: '1',
    title: 'Test Note',
    content: 'Test content',
    tags: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Creates a mock PendingSync object with type-safe defaults.
 * Useful for testing sync queue operations.
 *
 * @param overrides - Partial PendingSync object to override default values
 * @returns A complete PendingSync object with all required fields
 *
 * @example
 * const pendingSync = createMockPendingSync({ operation: 'delete' })
 */
export function createMockPendingSync(overrides?: Partial<PendingSync>): PendingSync {
  return {
    id: '1',
    noteId: '1',
    operation: 'create',
    data: createMockNote(),
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}
