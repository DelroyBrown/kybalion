import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { useReaderStore } from './readerStore'

/** Everything known about the library's books, keyed by API slug. */
export const BOOKS = {
  'the-kybalion': {
    slug: 'the-kybalion',
    title: 'The Kybalion',
    shortTitle: 'Kybalion',
    tagline: 'The Hermetic Philosophy of Ancient Egypt and Greece',
    chapterLabel: 'Chapter',
    chapterNumerals: 'roman',
    defaultReaderTheme: 'midnight',
    hasPrinciples: true,
  },
  'ethiopian-bible': {
    slug: 'ethiopian-bible',
    title: 'The Ethiopian Bible',
    shortTitle: 'Ethiopian Bible',
    tagline: 'The Broader Canon of the Tewahedo Church',
    chapterLabel: 'Book',
    chapterNumerals: 'arabic',
    defaultReaderTheme: 'abyss',
    hasPrinciples: false,
  },
}

export const BOOK_ORDER = ['the-kybalion', 'ethiopian-bible']

/**
 * App-level appearance and library state: which book is open and whether
 * the interface is in dark or light mode. Persisted per device.
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      activeBookSlug: 'the-kybalion',
      colorMode: 'dark', // dark | light

      setColorMode: (colorMode) => set({ colorMode }),
      toggleColorMode: () =>
        set((state) => ({ colorMode: state.colorMode === 'dark' ? 'light' : 'dark' })),

      setActiveBook: (slug) => {
        if (!BOOKS[slug] || slug === get().activeBookSlug) return
        const previous = BOOKS[get().activeBookSlug]
        set({ activeBookSlug: slug })
        // If the reader theme was left at the previous book's default,
        // follow the new book's own atmosphere; explicit choices are kept.
        const reader = useReaderStore.getState()
        if (reader.settings.theme === previous.defaultReaderTheme) {
          reader.setSetting('theme', BOOKS[slug].defaultReaderTheme)
        }
      },
    }),
    { name: 'kybalion-app' }
  )
)

/** The static config of the active book. */
export function useActiveBook() {
  return BOOKS[useAppStore((state) => state.activeBookSlug)]
}
