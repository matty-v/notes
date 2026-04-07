import { marked } from 'marked'
import { ReactNode } from 'react'

// Regex for detecting plain URLs (not in HTML attributes)
// Uses negative lookbehind to avoid matching URLs already in href or src attributes
const URL_REGEX = /(?<!["=])(https?:\/\/[^\s<>[\]{}|\\^`"']+|www\.[^\s<>[\]{}|\\^`"']+)/gi

// Allow only safe URL schemes in rendered links. `javascript:`, `data:`, `vbscript:`,
// `file:`, etc. are rejected to prevent XSS. Relative URLs (no scheme) are allowed.
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:']

function sanitizeHref(href: string): string | null {
  const trimmed = href.trim()
  // Reject empty hrefs
  if (!trimmed) return null
  // Allow protocol-relative URLs
  if (trimmed.startsWith('//')) return trimmed
  // Allow relative paths and fragments
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed
  }
  // For anything that looks like an absolute URL, validate the scheme.
  // The colon check guards against authority-less paths like "foo/bar".
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx === -1) return trimmed // no scheme → relative path
  // A colon before any "/" means it's a scheme (e.g., "javascript:..."); after means
  // it's a path segment (e.g., "foo/bar:baz"), which is also a relative path.
  const slashIdx = trimmed.indexOf('/')
  if (slashIdx !== -1 && slashIdx < colonIdx) return trimmed
  const scheme = trimmed.slice(0, colonIdx + 1).toLowerCase()
  return SAFE_URL_SCHEMES.includes(scheme) ? trimmed : null
}

const renderer = new marked.Renderer()

// Override link rendering to open in new tab
renderer.link = ({ href, text }) => {
  const safeHref = sanitizeHref(href)
  if (!safeHref) {
    // Render rejected links as plain text so the user still sees the label
    return text
  }
  return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer" class="text-[var(--accent-cyan)] hover:text-[var(--accent-purple)] underline underline-offset-2 transition-colors">${text}</a>`
}

// Override paragraph to add proper spacing
renderer.paragraph = ({ text }) => {
  return `<p class="mb-3">${text}</p>`
}

// Override headings for styling
renderer.heading = ({ text, depth }) => {
  const sizeClass = {
    1: 'text-2xl',
    2: 'text-xl',
    3: 'text-lg',
    4: 'text-base',
    5: 'text-sm',
    6: 'text-sm',
  }[depth] || 'text-base'

  return `<h${depth} class="font-semibold ${sizeClass} mt-4 mb-2">${text}</h${depth}>`
}

// Override code blocks
renderer.code = ({ text }) => {
  return `<pre class="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg overflow-x-auto mb-3"><code class="text-sm font-mono">${escapeHtml(text)}</code></pre>`
}

// Override lists
renderer.list = ({ items, ordered }) => {
  const tag = ordered ? 'ol' : 'ul'
  const itemsHtml = items.map((item) => `<li class="${ordered ? '' : 'ml-4'}">${item.text}</li>`).join('')
  const className = ordered ? 'list-decimal ml-5 mb-3' : 'list-disc ml-5 mb-3'
  return `<${tag} class="${className}">${itemsHtml}</${tag}>`
}

marked.setOptions({
  renderer,
  breaks: true, // Convert \n to <br>
  gfm: false, // Disable GFM to prevent auto-linking URLs (we handle that with regex)
})

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export function renderMarkdown(content: string): ReactNode {
  try {
    // First parse the markdown
    let html = marked(content) as string
    // Then linkify plain URLs in the HTML
    html = html.replace(URL_REGEX, (match) => {
      const href = match.startsWith('www.') ? `https://${match}` : match
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-[var(--accent-cyan)] hover:text-[var(--accent-purple)] underline underline-offset-2 transition-colors">${escapeHtml(match)}</a>`
    })
    return (
      <div
        className="prose prose-invert max-w-none text-base text-muted-foreground font-light leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch (error) {
    // Fallback to plain text if markdown parsing fails
    console.error('Error parsing markdown:', error)
    return <div className="text-base text-muted-foreground font-light leading-relaxed whitespace-pre-wrap">{content}</div>
  }
}
