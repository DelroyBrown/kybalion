/** Shared Framer Motion presets — restrained, consistent timing. */

export const EASE = [0.25, 0.1, 0.25, 1]

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.25, ease: EASE } },
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: EASE } },
}

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08 } },
}

/**
 * Route changes: the leaving page sinks and dims briefly, the arriving one
 * rises into place with a long settling ease — a page being turned rather
 * than swapped. Transform + opacity only, so even the longest chapters
 * stay cheap to animate.
 */
export const pageTransition = {
  initial: { opacity: 0, y: 22, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.996,
    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
  },
}
