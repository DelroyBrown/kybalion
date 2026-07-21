import { motion } from 'framer-motion'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { Sigil } from './Sigil'

/**
 * The Ethiopian Bible's seal: two interlaced squares forming the
 * eight-pointed Tewahedo star of the Nativity, holding a small cross at its
 * heart — clearly its own mark beside the Kybalion's heptagram sigil, while
 * keeping the family language of concentric stroked circles. Like the
 * sigil, it can draw itself line by line on first reveal.
 */
function squarePath(cx, cy, r, rotate) {
  const points = []
  for (let i = 0; i < 4; i += 1) {
    const angle = rotate + (i * Math.PI) / 2
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M ${points.join(' L ')} Z`
}

export function TewahedoStar({ size = 96, animated = false, className = '' }) {
  const reduceMotion = usePrefersReducedMotion()
  const draw = animated && !reduceMotion

  const lineProps = (delay) =>
    draw
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 1.5, delay, ease: 'easeInOut' },
        }
      : {}
  const fadeProps = (delay, opacity) =>
    draw
      ? { initial: { opacity: 0 }, animate: { opacity }, transition: { delay, duration: 0.5 } }
      : {}

  // A dot at each of the star's eight points.
  const dots = Array.from({ length: 8 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 4
    return [60 + 44 * Math.cos(angle), 60 + 44 * Math.sin(angle)]
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
      <motion.circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 5" {...lineProps(0.25)} />
      <motion.path d={squarePath(60, 60, 44, -Math.PI / 2)} stroke="currentColor" strokeWidth="0.9" opacity="0.85" {...lineProps(0.5)} />
      <motion.path d={squarePath(60, 60, 44, -Math.PI / 4)} stroke="currentColor" strokeWidth="0.9" opacity="0.85" {...lineProps(0.75)} />
      <motion.circle cx="60" cy="60" r="13" stroke="currentColor" strokeWidth="0.75" opacity="0.7" {...lineProps(1.3)} />
      <motion.path d="M 60 52.5 L 60 67.5" stroke="currentColor" strokeWidth="0.9" opacity="0.85" {...lineProps(1.6)} />
      <motion.path d="M 52.5 60 L 67.5 60" stroke="currentColor" strokeWidth="0.9" opacity="0.85" {...lineProps(1.75)} />
      {dots.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="1.8"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.8"
          {...fadeProps(1.1 + i * 0.1, 0.8)}
        />
      ))}
      <motion.circle cx="60" cy="60" r="1.6" fill="currentColor" opacity="0.9" {...fadeProps(2.1, 0.9)} />
    </svg>
  )
}

/** The emblem of whichever book is named — heptagram sigil for the
 *  Kybalion, interlaced Tewahedo star for the Ethiopian Bible. */
export function BookEmblem({ bookSlug, size = 34, animated = false, className = '' }) {
  if (bookSlug === 'ethiopian-bible') {
    return <TewahedoStar size={size} animated={animated} className={className} />
  }
  return <Sigil size={size} animated={animated} className={className} />
}
