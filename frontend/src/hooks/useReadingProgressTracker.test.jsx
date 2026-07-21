import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLocalProgressStore } from '../stores/localProgressStore'
import { useReadingProgressTracker } from './useReadingProgressTracker'

/**
 * Captures observer instances so tests can inspect what was observed and
 * fire intersection entries by hand.
 */
class MockIntersectionObserver {
  static instances = []

  constructor(callback) {
    this.callback = callback
    this.observed = new Set()
    MockIntersectionObserver.instances.push(this)
  }

  observe(element) {
    this.observed.add(element)
  }

  unobserve(element) {
    this.observed.delete(element)
  }

  disconnect() {
    this.observed.clear()
  }

  intersect(element) {
    this.callback([{ isIntersecting: true, target: element }])
  }
}

function Probe({ chapterSlug = 'chapter-one' }) {
  const { observeParagraph } = useReadingProgressTracker({ chapterSlug, totalParagraphs: 4 })
  return (
    <div>
      {[1, 2, 3, 4].map((order) => (
        <p key={order} ref={observeParagraph} data-global-order={order}>
          Paragraph {order}
        </p>
      ))}
    </div>
  )
}

function renderProbe(props) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Probe {...props} />
    </QueryClientProvider>
  )
}

describe('useReadingProgressTracker', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    useLocalProgressStore.getState().clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('observes paragraphs whose refs attach before effects run (production ordering)', () => {
    // Without StrictMode, refs fire once, before useEffect — exactly like a
    // production build. Every paragraph must still be observed.
    renderProbe()
    const observed = MockIntersectionObserver.instances.flatMap((o) => [...o.observed])
    expect(observed).toHaveLength(4)
  })

  it('records the reading position when paragraphs intersect', () => {
    const { unmount } = renderProbe()
    const observer = MockIntersectionObserver.instances[0]
    const paragraphs = [...observer.observed]

    observer.intersect(paragraphs[0])
    observer.intersect(paragraphs[2])
    unmount() // flushes on cleanup

    const entry = useLocalProgressStore.getState().byChapter['chapter-one']
    expect(entry).toBeDefined()
    expect(entry.lastParagraphOrder).toBe(3)
    expect(entry.furthestParagraphOrder).toBe(3)
    expect(entry.percent).toBe(75)
    expect(entry.completed).toBe(false)
  })

  it('ignores late entries from paragraphs that already left the document', () => {
    const { unmount } = renderProbe()
    const observer = MockIntersectionObserver.instances[0]
    const detached = document.createElement('p')
    detached.dataset.globalOrder = '4'

    observer.intersect(detached)
    unmount()

    expect(useLocalProgressStore.getState().byChapter['chapter-one']).toBeUndefined()
  })
})
