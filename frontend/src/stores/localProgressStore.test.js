import { beforeEach, describe, expect, it } from 'vitest'

import { useLocalProgressStore } from './localProgressStore'

describe('localProgressStore', () => {
  beforeEach(() => {
    useLocalProgressStore.getState().clear()
  })

  it('records progress per chapter', () => {
    useLocalProgressStore.getState().record('chapter-one', { furthestParagraphOrder: 4, percent: 40 })
    expect(useLocalProgressStore.getState().byChapter['chapter-one'].percent).toBe(40)
  })

  it('never regresses furthest position or percent', () => {
    const { record } = useLocalProgressStore.getState()
    record('chapter-one', { furthestParagraphOrder: 6, percent: 60 })
    record('chapter-one', { furthestParagraphOrder: 2, percent: 20 })
    const entry = useLocalProgressStore.getState().byChapter['chapter-one']
    expect(entry.furthestParagraphOrder).toBe(6)
    expect(entry.percent).toBe(60)
  })

  it('keeps completion sticky', () => {
    const { record } = useLocalProgressStore.getState()
    record('chapter-one', { completed: true, percent: 100 })
    record('chapter-one', { percent: 10 })
    expect(useLocalProgressStore.getState().byChapter['chapter-one'].completed).toBe(true)
  })

  it('serialises entries for the account-merge endpoint', () => {
    useLocalProgressStore.getState().record('chapter-one', { furthestParagraphOrder: 3, percent: 30 })
    const entries = useLocalProgressStore.getState().toMergeEntries()
    expect(entries).toEqual([
      {
        chapter: 'chapter-one',
        last_paragraph_order: 0,
        furthest_paragraph_order: 3,
        percent_complete: 30,
        completed: false,
      },
    ])
  })
})
