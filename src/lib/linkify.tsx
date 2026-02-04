import { ReactNode } from 'react'

const URL_REGEX = /(\bhttps?:\/\/[^\s<>[\]{}|\\^`"']+|\bwww\.[^\s<>[\]{}|\\^`"']+)/gi

export function linkify(text: string): ReactNode[] {
  const parts = text.split(URL_REGEX)

  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      // Reset regex lastIndex since we're using 'g' flag
      URL_REGEX.lastIndex = 0
      const href = part.startsWith('www.') ? `https://${part}` : part
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--accent-cyan)] hover:text-[var(--accent-purple)] underline underline-offset-2 transition-colors"
        >
          {part}
        </a>
      )
    }
    return part
  })
}
