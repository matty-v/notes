import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewMode } from '@/hooks/use-view-mode'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'

describe('useViewMode', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should default to list view', () => {
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('list')
  })

  it('should persist to localStorage when view mode changes', () => {
    const { result } = renderHook(() => useViewMode())

    act(() => {
      result.current.setViewMode('grid')
    })

    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.VIEW_MODE)).toBe('grid')
    expect(result.current.viewMode).toBe('grid')
  })

  it('should read from localStorage on mount', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, 'grid')
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('grid')
  })

  it('should handle invalid stored values by defaulting to list', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW_MODE, 'invalid')
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe('list')
  })

  it('should switch between list and grid modes', () => {
    const { result } = renderHook(() => useViewMode())

    act(() => {
      result.current.setViewMode('grid')
    })
    expect(result.current.viewMode).toBe('grid')

    act(() => {
      result.current.setViewMode('list')
    })
    expect(result.current.viewMode).toBe('list')
  })
})
