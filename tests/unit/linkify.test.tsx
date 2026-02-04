import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { linkify } from '@/lib/linkify'

describe('linkify', () => {
  describe('URL detection', () => {
    it('should detect https URLs', () => {
      const result = linkify('Check out https://example.com for more')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveTextContent('https://example.com')
    })

    it('should detect http URLs', () => {
      const result = linkify('Visit http://example.com today')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'http://example.com')
    })

    it('should detect URLs with paths and query params', () => {
      const result = linkify('See https://example.com/path?query=value&other=123')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://example.com/path?query=value&other=123')
    })

    it('should detect multiple URLs in the same text', () => {
      const result = linkify('Visit https://one.com and https://two.com')
      render(<div>{result}</div>)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      expect(links[0]).toHaveAttribute('href', 'https://one.com')
      expect(links[1]).toHaveAttribute('href', 'https://two.com')
    })

    it('should handle consecutive URL detection correctly (lastIndex bug regression)', () => {
      // This test verifies the fix for the lastIndex bug with global regex flag
      // When using test() with 'g' flag, lastIndex advances, causing alternating matches to fail
      const result = linkify('https://first.com https://second.com https://third.com')
      render(<div>{result}</div>)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
      expect(links[0]).toHaveAttribute('href', 'https://first.com')
      expect(links[1]).toHaveAttribute('href', 'https://second.com')
      expect(links[2]).toHaveAttribute('href', 'https://third.com')
    })

    it('should return plain text when no URLs present', () => {
      const result = linkify('Just plain text here')
      render(<div data-testid="container">{result}</div>)

      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByTestId('container')).toHaveTextContent('Just plain text here')
    })
  })

  describe('www. handling', () => {
    it('should detect www. URLs without protocol', () => {
      const result = linkify('Visit www.example.com for info')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('www.example.com')
    })

    it('should prepend https:// to www. URLs', () => {
      const result = linkify('Go to www.example.com')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://www.example.com')
    })

    it('should not modify https://www. URLs', () => {
      const result = linkify('Visit https://www.example.com')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://www.example.com')
    })
  })

  describe('output format', () => {
    it('should render links with target="_blank"', () => {
      const result = linkify('https://example.com')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should render links with rel="noopener noreferrer" for security', () => {
      const result = linkify('https://example.com')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should preserve text before and after URLs', () => {
      const result = linkify('Check https://example.com now!')
      render(<div data-testid="container">{result}</div>)

      const container = screen.getByTestId('container')
      expect(container).toHaveTextContent('Check https://example.com now!')
    })

    it('should handle URL at start of text', () => {
      const result = linkify('https://example.com is great')
      render(<div data-testid="container">{result}</div>)

      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')
      expect(screen.getByTestId('container')).toHaveTextContent('https://example.com is great')
    })

    it('should handle URL at end of text', () => {
      const result = linkify('Visit https://example.com')
      render(<div data-testid="container">{result}</div>)

      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')
      expect(screen.getByTestId('container')).toHaveTextContent('Visit https://example.com')
    })
  })

  describe('event propagation', () => {
    it('should stop click propagation on links', async () => {
      const user = userEvent.setup()
      const parentClickHandler = vi.fn()

      const result = linkify('Click https://example.com here')
      render(
        <div onClick={parentClickHandler} data-testid="parent">
          {result}
        </div>
      )

      const link = screen.getByRole('link')
      await user.click(link)

      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('case insensitivity', () => {
    it('should detect HTTPS in uppercase', () => {
      const result = linkify('Visit HTTPS://EXAMPLE.COM')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'HTTPS://EXAMPLE.COM')
    })

    it('should detect WWW in uppercase', () => {
      const result = linkify('Go to WWW.EXAMPLE.COM')
      render(<div>{result}</div>)

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('WWW.EXAMPLE.COM')
    })
  })
})
