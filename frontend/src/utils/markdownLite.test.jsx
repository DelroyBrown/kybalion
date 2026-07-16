import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderMarkdownLite } from './markdownLite'

describe('renderMarkdownLite', () => {
  it('renders bold and italic tokens', () => {
    render(<div>{renderMarkdownLite('plain **bold** and *italic* text')}</div>)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('italic').tagName).toBe('EM')
  })

  it('splits double newlines into paragraphs', () => {
    const { container } = render(<div>{renderMarkdownLite('first\n\nsecond')}</div>)
    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('never injects HTML from user content', () => {
    const { container } = render(<div>{renderMarkdownLite('<script>alert(1)</script> <img src=x>')}</div>)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<script>')
  })

  it('returns null for empty input', () => {
    expect(renderMarkdownLite('')).toBeNull()
  })
})
