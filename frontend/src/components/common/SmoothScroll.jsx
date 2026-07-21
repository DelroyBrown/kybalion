import Lenis from 'lenis'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useReaderStore } from '../../stores/readerStore'

let instance = null

/** The active Lenis instance, if smooth scrolling is running. */
export function getLenis() {
  return instance
}

/**
 * Jump the page to an absolute Y position, going through Lenis when it is
 * running. Setting window.scrollY behind Lenis's back leaves its internal
 * target stale, and the next wheel tick snaps back to the old position —
 * so every programmatic scroll in the app must come through here.
 */
export function scrollToY(y, { immediate = true } = {}) {
  const target = Math.max(0, y)
  if (instance) {
    // Paragraphs use content-visibility, so the page's measured height moves
    // as regions render — remeasure before jumping into one.
    instance.resize()
    instance.scrollTo(target, { immediate, force: true })
  } else {
    window.scrollTo(0, target)
  }
}

/**
 * Two scrolling characters, both eased. Around the app: a slow, weighted
 * glide that suits an archive. Inside the reader: a shorter lerp and
 * full-strength wheel, so long scripture books answer the wheel directly
 * while still gliding to a stop.
 *
 * Touch scrolling stays native (it already has physical inertia), inner
 * panels opt out via `data-lenis-prevent`, and the whole effect is disabled
 * by `prefers-reduced-motion` or the in-app motion setting.
 */
const PROFILES = {
  app: { lerp: 0.045, wheelMultiplier: 0.7 },
  reader: { lerp: 0.14, wheelMultiplier: 1.0 },
}

export function SmoothScroll() {
  const systemReduced = usePrefersReducedMotion()
  const userReduced = useReaderStore((state) => state.settings.reduceMotion)
  const profile = useLocation().pathname.startsWith('/read') ? 'reader' : 'app'
  const enabled = !systemReduced && !userReduced

  useEffect(() => {
    if (!enabled) return undefined
    const lenis = new Lenis({
      ...PROFILES[profile],
      smoothWheel: true,
      syncTouch: false,
    })
    instance = lenis

    let frame
    const raf = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // Lenis caches the scroll limit and watches <html> for size changes, but
    // this app pins `html { height: 100% }` — that box never grows, so the
    // limit measured while a page is still loading would stand forever and
    // Lenis would swallow the wheel against it. Watch the body instead.
    const resizeObserver = new ResizeObserver(() => lenis.resize())
    resizeObserver.observe(document.body)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      lenis.destroy()
      instance = null
    }
  }, [enabled, profile])

  return null
}
