import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewModeToggle } from '@/components/view-mode-toggle'

describe('ViewModeToggle', () => {
  it('should render both list and grid buttons', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle value="list" onChange={onChange} />)

    expect(screen.getByLabelText('List view')).toBeInTheDocument()
    expect(screen.getByLabelText('Grid view')).toBeInTheDocument()
  })

  it('should show list button as active when value is list', () => {
    const onChange = vi.fn()
    const { container } = render(<ViewModeToggle value="list" onChange={onChange} />)

    const buttons = container.querySelectorAll('button')
    expect(buttons[0]).toHaveClass('text-[var(--accent-cyan)]')
  })

  it('should show grid button as active when value is grid', () => {
    const onChange = vi.fn()
    const { container } = render(<ViewModeToggle value="grid" onChange={onChange} />)

    const buttons = container.querySelectorAll('button')
    expect(buttons[1]).toHaveClass('text-[var(--accent-cyan)]')
  })

  it('should call onChange with list when list button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewModeToggle value="grid" onChange={onChange} />)

    await user.click(screen.getByLabelText('List view'))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  it('should call onChange with grid when grid button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewModeToggle value="list" onChange={onChange} />)

    await user.click(screen.getByLabelText('Grid view'))
    expect(onChange).toHaveBeenCalledWith('grid')
  })

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewModeToggle value="list" onChange={onChange} />)

    const gridButton = screen.getByLabelText('Grid view')
    gridButton.focus()
    expect(gridButton).toHaveFocus()

    await user.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith('grid')
  })
})
