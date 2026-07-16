import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Mirrors backend DEFAULT_READER_SETTINGS — keys must stay in sync. */
export const DEFAULT_SETTINGS = {
  fontScale: 1.0,
  lineHeight: 1.9,
  width: 'comfortable', // narrow | comfortable | wide
  theme: 'midnight', // midnight | obsidian | parchment | sepia | crimson
  mode: 'guided', // clean | guided | study | reflection
  showParagraphNumbers: false,
  ambientEffects: true,
  reduceMotion: false,
  showStreak: false,
}

export const READER_THEMES = [
  { key: 'midnight', label: 'Midnight' },
  { key: 'obsidian', label: 'Obsidian' },
  { key: 'parchment', label: 'Parchment' },
  { key: 'sepia', label: 'Deep Sepia' },
  { key: 'crimson', label: 'Low-Light Crimson' },
]

export const READING_MODES = [
  { key: 'clean', label: 'Clean', description: 'Original text only. Markers and commentary hidden.' },
  { key: 'guided', label: 'Guided', description: 'Curated annotation markers with explanations and definitions.' },
  { key: 'study', label: 'Study', description: 'Paragraph numbers, notes, highlights, and related passages.' },
  { key: 'reflection', label: 'Reflection', description: 'Quiet layout with journaling prompts as you read.' },
]

export const useReaderStore = create(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      setSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),
      setSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
    }),
    { name: 'kybalion-reader' }
  )
)
