import { marked } from 'marked'
import { ReactNode } from 'react'

// Configure marked to not parse URLs as links (we handle those with linkify)
const renderer = new marked.Renderer()

// Override link rendering to open in new tab
renderer.link = ({ href, text }) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[var(--accent-cyan)] hover:text-[var(--accent-purple)] underline underline-offset-2 transition-colors">${text}</a>`
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
  gfm: true, // Use GitHub Flavored Markdown
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
    const html = marked(content) as string
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
