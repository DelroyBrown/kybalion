import React from 'react'

/**
 * Markdown-lite rendering for user notes and journal entries.
 * Supports **bold**, *italic*, and paragraph breaks. Built entirely from
 * React elements — no HTML injection, so user content can never carry XSS.
 */
function renderInline(text, keyPrefix) {
  const nodes = []
  // Tokenise **bold** first, then *italic* inside the remainder.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  parts.forEach((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      nodes.push(React.createElement('strong', { key, className: 'font-semibold' }, part.slice(2, -2)))
    } else if (/^\*[^*]+\*$/.test(part)) {
      nodes.push(React.createElement('em', { key }, part.slice(1, -1)))
    } else if (part) {
      nodes.push(part)
    }
  })
  return nodes
}

export function renderMarkdownLite(text) {
  if (!text) return null
  return text
    .split(/\n{2,}/)
    .filter((block) => block.trim())
    .map((block, i) =>
      React.createElement(
        'p',
        { key: i },
        block.split('\n').flatMap((line, j, lines) => {
          const content = renderInline(line, `${i}-${j}`)
          return j < lines.length - 1
            ? [...content, React.createElement('br', { key: `br-${i}-${j}` })]
            : content
        })
      )
    )
}
