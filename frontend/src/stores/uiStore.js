import { create } from 'zustand'

/** Ephemeral interface state — never persisted. */
export const useUiStore = create((set) => ({
  activePassageSlug: null,
  openPassage: (slug) => set({ activePassageSlug: slug }),
  closePassage: () => set({ activePassageSlug: null }),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  distractionFree: false,
  toggleDistractionFree: () =>
    set((state) => ({ distractionFree: !state.distractionFree })),

  selection: null, // { paragraphId, start, end, rect }
  setSelection: (selection) => set({ selection }),
}))
