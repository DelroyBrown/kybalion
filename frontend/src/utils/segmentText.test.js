import { describe, expect, it } from 'vitest'

import { segmentText } from './segmentText'

describe('segmentText', () => {
  const text = 'Nothing rests; everything moves; everything vibrates.'

  it('returns the whole text as one segment when there are no ranges', () => {
    const segments = segmentText(text, [])
    expect(segments).toHaveLength(1)
    expect(segments[0].text).toBe(text)
    expect(segments[0].ranges).toEqual([])
  })

  it('splits around a single range', () => {
    const segments = segmentText(text, [{ start: 0, end: 13, type: 'passage', data: { slug: 'a' } }])
    expect(segments.map((s) => s.text)).toEqual(['Nothing rests', text.slice(13)])
    expect(segments[0].ranges).toHaveLength(1)
    expect(segments[1].ranges).toHaveLength(0)
  })

  it('handles overlapping passage and highlight ranges', () => {
    const segments = segmentText(text, [
      { start: 0, end: 13, type: 'passage', data: { slug: 'a' } },
      { start: 8, end: 25, type: 'highlight', data: { id: 1 } },
    ])
    // Boundaries at 0, 8, 13, 25, end.
    expect(segments.map((s) => s.text.length)).toEqual([8, 5, 12, text.length - 25])
    const overlap = segments[1]
    expect(overlap.ranges.map((r) => r.type).sort()).toEqual(['highlight', 'passage'])
  })

  it('ignores ranges that fall outside the text', () => {
    const segments = segmentText(text, [
      { start: -4, end: 10, type: 'highlight', data: {} },
      { start: 10, end: 9999, type: 'highlight', data: {} },
      { start: 20, end: 10, type: 'highlight', data: {} },
    ])
    expect(segments).toHaveLength(1)
  })

  it('reassembles to the original text', () => {
    const segments = segmentText(text, [
      { start: 3, end: 17, type: 'passage', data: {} },
      { start: 10, end: 30, type: 'highlight', data: {} },
      { start: 30, end: 40, type: 'highlight', data: {} },
    ])
    expect(segments.map((s) => s.text).join('')).toBe(text)
  })
})
