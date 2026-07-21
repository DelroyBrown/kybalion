import { Sigil } from './Sigil'

/**
 * The Ethiopian Bible's seal: an eight-pointed star — the Tewahedo star of
 * the Nativity — inside concentric circles, echoing the Kybalion's
 * heptagram sigil without imitating it. Strokes only, like its sibling.
 */
function starPoints(cx, cy, rOuter, rInner) {
  const points = []
  for (let i = 0; i < 16; i += 1) {
    const r = i % 2 === 0 ? rOuter : rInner
    const angle = -Math.PI / 2 + (i * Math.PI) / 8
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M ${points.join(' L ')} Z`
}

export function TewahedoStar({ size = 96, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      <path d={starPoints(60, 60, 44, 24)} stroke="currentColor" strokeWidth="0.9" opacity="0.85" />
      <path d={starPoints(60, 60, 18, 10)} stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <circle cx="60" cy="60" r="1.8" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

/** The emblem of whichever book is named — sigil for the Kybalion,
 *  eight-pointed star for the Ethiopian Bible. */
export function BookEmblem({ bookSlug, size = 34, className = '' }) {
  if (bookSlug === 'ethiopian-bible') {
    return <TewahedoStar size={size} className={className} />
  }
  return <Sigil size={size} className={className} />
}
