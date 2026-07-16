import Lenis from 'lenis'
import { useEffect } from 'react'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useReaderStore } from '../../stores/readerStore'

let instance = null

/** The active Lenis instance, if smooth scrolling is running. */
export function getLenis() {
  return instance
}

/**
 * Slow, weighted page scrolling: wheel input is eased with a low lerp so the
 * page glides rather than jumps. Touch scrolling stays native (it already
 * has physical inertia), inner panels opt out via `data-lenis-prevent`, and
 * the whole effect is disabled by `prefers-reduced-motion` or the in-app
 * motion setting.
 */
export function SmoothScroll() {
  const systemReduced = usePrefersReducedMotion()
  const userReduced = useReaderStore((state) => state.settings.reduceMotion)
  const enabled = !systemReduced && !userReduced

  useEffect(() => {
    if (!enabled) return undefined
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
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

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      instance = null
    }
  }, [enabled])

  return null
}
