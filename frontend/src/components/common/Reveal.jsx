import { motion } from 'framer-motion'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useReaderStore } from '../../stores/readerStore'
import { EASE } from '../../utils/motion'

/** True when scroll-linked reveals should play. */
export function useRevealAllowed() {
  const systemReduced = usePrefersReducedMotion()
  const userReduced = useReaderStore((state) => state.settings.reduceMotion)
  return !systemReduced && !userReduced
}

/**
 * Scroll reveal: content rises gently into place the first time it enters
 * the viewport. Renders a plain element when motion is reduced.
 */
export function Reveal({ children, delay = 0, y = 20, duration = 0.8, className }) {
  const allowed = useRevealAllowed()
  if (!allowed) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
