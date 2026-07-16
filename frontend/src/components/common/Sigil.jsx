import { motion } from 'framer-motion'

import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

/**
 * The application's original geometric seal: a heptagram — one point for
 * each principle — inside concentric circles. Drawn with strokes only so it
 * can render at any size and animate its own line-drawing on first reveal.
 */
function heptagramPoints(cx, cy, r) {
  const points = []
  for (let i = 0; i < 7; i += 1) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 7
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return points
}

function heptagramPath(cx, cy, r) {
  const points = heptagramPoints(cx, cy, r)
  // {7/3} star polygon: each point connects to the one three steps on.
  let index = 0
  const visited = []
  do {
    visited.push(points[index])
    index = (index + 3) % 7
  } while (index !== 0)
  visited.push(points[0])
  return `M ${visited.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')}`
}

export function Sigil({ size = 96, animated = false, className = '' }) {
  const reduceMotion = usePrefersReducedMotion()
  const draw = animated && !reduceMotion
  const points = heptagramPoints(60, 60, 44)

  const lineProps = (delay) =>
    draw
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 1.6, delay, ease: 'easeInOut' },
        }
      : {}

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
      <motion.circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.5" opacity="0.35" {...lineProps(0.3)} />
      <motion.path d={heptagramPath(60, 60, 44)} stroke="currentColor" strokeWidth="0.9" opacity="0.85" {...lineProps(0.6)} />
      <motion.circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="0.75" opacity="0.7" {...lineProps(1.4)} />
      <motion.circle cx="60" cy="60" r="1.8" fill="currentColor" opacity="0.9" {...(draw ? { initial: { opacity: 0 }, animate: { opacity: 0.9 }, transition: { delay: 2.1, duration: 0.6 } } : {})} />
      {points.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="2.2"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.8"
          {...(draw
            ? { initial: { opacity: 0 }, animate: { opacity: 0.8 }, transition: { delay: 1.2 + i * 0.12, duration: 0.5 } }
            : {})}
        />
      ))}
    </svg>
  )
}
