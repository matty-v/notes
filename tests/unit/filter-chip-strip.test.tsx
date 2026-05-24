import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterChipStrip } from '@/components/filter-chip-strip'

describe('FilterChipStrip', () => {
  const mockOnRemoveTag = vi.fn()
  const mockOnClearAll = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null when tagFilter is empty', () => {
    const { container } = render(
      <FilterChipStrip tagFilter={[]} onRemoveTag={mockOnRemoveTag} onClearAll={mockOnClearAll} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a chip for each active tag', () => {
    render(
      <FilterChipStrip
        tagFilter={['work', 'react']}
        onRemoveTag={mockOnRemoveTag}
        onClearAll={mockOnClearAll}
      />
    )
    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
  })

  it('renders Clear all chip when tags are active', () => {
    render(
      <FilterChipStrip
        tagFilter={['work']}
        onRemoveTag={mockOnRemoveTag}
        onClearAll={mockOnClearAll}
      />
    )
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('calls onRemoveTag with the tag when a chip dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterChipStrip
        tagFilter={['work', 'react']}
        onRemoveTag={mockOnRemoveTag}
        onClearAll={mockOnClearAll}
      />
    )
    const dismissButtons = screen.getAllByRole('button', { name: /remove work/i })
    await user.click(dismissButtons[0])
    expect(mockOnRemoveTag).toHaveBeenCalledWith('work')
  })

  it('calls onClearAll when Clear all button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterChipStrip
        tagFilter={['work', 'react']}
        onRemoveTag={mockOnRemoveTag}
        onClearAll={mockOnClearAll}
      />
    )
    await user.click(screen.getByText('Clear all'))
    expect(mockOnClearAll).toHaveBeenCalledOnce()
  })

  it('shows "any of:" prefix when two or more tags are active', () => {
    render(
      <FilterChipStrip
        tagFilter={['work', 'react']}
        onRemoveTag={mockOnRemoveTag}
        onClearAll={mockOnClearAll}
      />
    )
    expect(screen.getByText('any of:')).toBeInTheDocument()
  })

  it('does not show "any of:" prefix when only one tag is active', () => {
    render(
      <FilterChipStrip
        tagFilter={['work']}
        onRemoveTag={mockOnRemoveTag}
        onClearAll={mockOnClearAll}
      />
    )
    expect(screen.queryByText('any of:')).not.toBeInTheDocument()
  })
})
