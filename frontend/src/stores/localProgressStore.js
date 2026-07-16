import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Reading progress for anonymous visitors, kept locally. When the visitor
 * creates an account the entries are offered for merge into their profile
 * (see useMergeLocalProgress).
 */
export const useLocalProgressStore = create(
  persist(
    (set, get) => ({
      byChapter: {},
      record: (chapterSlug, patch) =>
        set((state) => {
          const existing = state.byChapter[chapterSlug] || {
            lastParagraphOrder: 0,
            furthestParagraphOrder: 0,
            percent: 0,
            completed: false,
          }
          return {
            byChapter: {
              ...state.byChapter,
              [chapterSlug]: {
                ...existing,
                ...patch,
                furthestParagraphOrder: Math.max(
                  existing.furthestParagraphOrder,
                  patch.furthestParagraphOrder ?? 0
                ),
                percent: Math.max(existing.percent, patch.percent ?? 0),
                completed: existing.completed || Boolean(patch.completed),
              },
            },
          }
        }),
      toMergeEntries: () =>
        Object.entries(get().byChapter).map(([chapter, p]) => ({
          chapter,
          last_paragraph_order: p.lastParagraphOrder,
          furthest_paragraph_order: p.furthestParagraphOrder,
          percent_complete: p.percent,
          completed: p.completed,
        })),
      clear: () => set({ byChapter: {} }),
    }),
    { name: 'kybalion-progress' }
  )
)
