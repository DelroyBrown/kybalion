import { useEffect } from 'react'

import { useAppStore } from '../../stores/appStore'

/**
 * Reflects the active book and colour mode onto <html> as data attributes,
 * which select the palette variable sets in styles/index.css.
 */
export function ThemeApplier() {
  const activeBookSlug = useAppStore((state) => state.activeBookSlug)
  const colorMode = useAppStore((state) => state.colorMode)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.book = activeBookSlug
    root.dataset.mode = colorMode
  }, [activeBookSlug, colorMode])

  return null
}
