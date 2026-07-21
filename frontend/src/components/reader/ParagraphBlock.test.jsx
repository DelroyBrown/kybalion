import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ParagraphBlock } from './ParagraphBlock'

const paragraph = {
  id: 1,
  order: 1,
  kind: 'body',
  is_placeholder: false,
  text: 'Nothing rests; everything moves; everything vibrates.',
  passages: [
    {
      id: 10,
      slug: 'axiom-vibration',
      start_offset: 0,
      end_offset: 13,
      annotation_count: 3,
      annotation_types: ['plain'],
      principles: ['vibration'],
    },
  ],
}

function renderBlock(overrides = {}) {
  const onOpenPassage = vi.fn()
  render(
    <ParagraphBlock
      paragraph={paragraph}
      globalOrder={1}
      showMarks
      showNumbers={false}
      onOpenPassage={onOpenPassage}
      {...overrides}
    />
  )
  return { onOpenPassage }
}

describe('ParagraphBlock', () => {
  it('renders the full paragraph text', () => {
    renderBlock()
    expect(screen.getByText(/everything vibrates/)).toBeInTheDocument()
  })

  it('marks the curated passage and opens it on click', () => {
    const { onOpenPassage } = renderBlock()
    const mark = screen.getByRole('button', { name: /Annotated passage/ })
    expect(mark).toHaveTextContent('Nothing rests')
    fireEvent.click(mark)
    expect(onOpenPassage).toHaveBeenCalledWith('axiom-vibration')
  })

  it('opens the passage from the keyboard', () => {
    const { onOpenPassage } = renderBlock()
    const mark = screen.getByRole('button', { name: /Annotated passage/ })
    fireEvent.keyDown(mark, { key: 'Enter' })
    expect(onOpenPassage).toHaveBeenCalledWith('axiom-vibration')
  })

  it('hides marks in clean reading mode', () => {
    renderBlock({ showMarks: false })
    expect(screen.queryByRole('button', { name: /Annotated passage/ })).toBeNull()
  })

  it('labels placeholder paragraphs', () => {
    render(
      <ParagraphBlock
        paragraph={{ ...paragraph, is_placeholder: true, passages: [] }}
        globalOrder={2}
        showMarks
        showNumbers={false}
        onOpenPassage={() => {}}
      />
    )
    expect(screen.getByText(/Placeholder — awaiting the verified/)).toBeInTheDocument()
  })

  it('renders user highlights as tinted spans', () => {
    renderBlock({
      highlights: [{ id: 5, start_offset: 15, end_offset: 31, style: 'gold' }],
    })
    const highlighted = document.querySelector('.user-highlight-gold')
    expect(highlighted).not.toBeNull()
    expect(highlighted.textContent).toBe('everything moves')
  })
})
