import { describe, expect, it } from 'vitest'

import { pickResumeTarget } from './ReadRedirect'

const CHAPTERS = [{ slug: 'eb-genesis' }, { slug: 'eb-exodus' }, { slug: 'eb-psalms' }]

describe('pickResumeTarget', () => {
  it('resumes the most recently read chapter of this book', () => {
    const target = pickResumeTarget({
      chapters: CHAPTERS,
      authed: false,
      serverProgress: [],
      localProgress: {
        'eb-genesis': { updatedAt: 100 },
        'eb-psalms': { updatedAt: 300 },
        'eb-exodus': { updatedAt: 200 },
      },
    })
    expect(target).toBe('eb-psalms')
  })

  it("never follows progress into another book's chapters", () => {
    const target = pickResumeTarget({
      chapters: CHAPTERS,
      authed: false,
      serverProgress: [],
      localProgress: {
        'the-hermetic-philosophy': { updatedAt: 900 },
        'eb-exodus': { updatedAt: 200 },
      },
    })
    expect(target).toBe('eb-exodus')
  })

  it('skips progress whose chapter no longer exists', () => {
    const target = pickResumeTarget({
      chapters: CHAPTERS,
      authed: false,
      serverProgress: [],
      localProgress: { 'eb-removed-book': { updatedAt: 900 } },
    })
    expect(target).toBeNull()
  })

  it('prefers server progress for signed-in readers, still scoped to the book', () => {
    const target = pickResumeTarget({
      chapters: CHAPTERS,
      authed: true,
      serverProgress: [{ chapter: 'the-hermetic-philosophy' }, { chapter: 'eb-exodus' }],
      localProgress: { 'eb-psalms': { updatedAt: 900 } },
    })
    expect(target).toBe('eb-exodus')
  })

  it('falls back to local progress when the server has none for this book', () => {
    const target = pickResumeTarget({
      chapters: CHAPTERS,
      authed: true,
      serverProgress: [{ chapter: 'the-hermetic-philosophy' }],
      localProgress: { 'eb-genesis': { updatedAt: 50 } },
    })
    expect(target).toBe('eb-genesis')
  })

  it('returns null when nothing has been read', () => {
    expect(
      pickResumeTarget({ chapters: CHAPTERS, authed: false, serverProgress: [], localProgress: {} })
    ).toBeNull()
  })
})
