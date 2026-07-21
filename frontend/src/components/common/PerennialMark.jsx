import { motion } from 'framer-motion'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

/**
 * The Perennial's own seal — the seed of life: six circles opening around a
 * seventh, a figure of return and renewal older than any one tradition. It
 * belongs to the library itself, beside (never above) each book's emblem,
 * and draws itself ring by ring on first reveal like its siblings.
 */
export function PerennialMark({ size = 96, animated = false, className = '' }) {
  const reduceMotion = usePrefersReducedMotion()
  const draw = animated && !reduceMotion

  const lineProps = (delay) =>
    draw
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 1.4, delay, ease: 'easeInOut' },
        }
      : {}

  const petals = Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3
    return [60 + 21 * Math.cos(angle), 60 + 21 * Math.sin(angle)]
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <motion.circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.75" opacity="0.5" {...lineProps(0)} />
      <motion.circle cx="60" cy="60" r="47" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 6" {...lineProps(0.25)} />
      <motion.circle cx="60" cy="60" r="21" stroke="currentColor" strokeWidth="0.8" opacity="0.8" {...lineProps(0.5)} />
      {petals.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="21"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.65"
          {...lineProps(0.7 + i * 0.16)}
        />
      ))}
      <motion.circle
        cx="60"
        cy="60"
        r="1.8"
        fill="currentColor"
        opacity="0.9"
        {...(draw
          ? { initial: { opacity: 0 }, animate: { opacity: 0.9 }, transition: { delay: 1.9, duration: 0.6 } }
          : {})}
      />
    </svg>
  )
}
