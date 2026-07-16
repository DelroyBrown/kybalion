import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AnnotationContent } from './AnnotationContent'

const passage = {
  slug: 'axiom-vibration',
  excerpt: 'Nothing rests; everything moves; everything vibrates.',
  is_placeholder: false,
  chapter: { slug: 'vibration', number: 9, title: 'Vibration' },
  principles: [{ slug: 'vibration', name: 'The Principle of Vibration', accent: 'amber', symbol: 'vibration' }],
  annotations: [
    {
      id: 1,
      annotation_type: { slug: 'plain', name: 'Plain English', order: 2 },
      title: 'In plain terms',
      body: 'Stillness is apparent, not real.',
      origin: 'editorial',
      attribution: 'Editorial commentary',
      related_principles: [],
      sources: [],
      ai_meta: null,
    },
    {
      id: 2,
      annotation_type: { slug: 'ai', name: 'AI Interpretation', order: 14 },
      title: 'A sceptical reading',
      body: 'A sceptic might note this repackages mood regulation.',
      origin: 'ai',
      attribution: '',
      related_principles: [],
      sources: [],
      ai_meta: { model: 'local-mock', reviewed: false },
    },
  ],
  definitions: [{ slug: 'vibration', term: 'Vibration', meaning: 'Motion as universal condition.', etymology: '' }],
  related_passages: [],
  visualisations: [],
}

function renderContent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AnnotationContent passage={passage} studyMode={false} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AnnotationContent', () => {
  it('always shows the original passage as a quotation', () => {
    renderContent()
    expect(screen.getByText(/“Nothing rests; everything moves/)).toBeInTheDocument()
  })

  it('renders only non-empty sections as tabs', () => {
    renderContent()
    const tabs = screen.getAllByRole('tab')
    const labels = tabs.map((tab) => tab.textContent)
    expect(labels).toContain('Plain English')
    expect(labels).toContain('Definitions')
    expect(labels).not.toContain('Related passages')
    expect(labels).not.toContain('My notes')
  })

  it('switches tab content on selection', () => {
    renderContent()
    fireEvent.click(screen.getByRole('tab', { name: 'Definitions' }))
    expect(screen.getByText('Motion as universal condition.')).toBeInTheDocument()
  })

  it('labels AI-generated commentary with model and review status', () => {
    renderContent()
    fireEvent.click(screen.getByRole('tab', { name: 'AI Interpretation' }))
    expect(screen.getByText(/AI-generated \(local-mock\)/)).toBeInTheDocument()
    expect(screen.getByText(/not yet reviewed/)).toBeInTheDocument()
  })
})
