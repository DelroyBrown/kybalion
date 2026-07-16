/**
 * Original stroke-drawn symbols for the seven principles. Each is built
 * from the shared geometric vocabulary — circles, arcs, mirrored forms,
 * waves, branching lines — and always appears alongside its text label.
 */
const STROKE = { stroke: 'currentColor', fill: 'none', strokeWidth: 1.1, strokeLinecap: 'round' }

const SYMBOLS = {
  // The monad: a circle holding its own centre.
  mentalism: (
    <>
      <circle cx="24" cy="24" r="15" {...STROKE} />
      <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="8" {...STROKE} opacity="0.45" />
    </>
  ),
  // Mirrored triangles across a horizon: as above, so below.
  correspondence: (
    <>
      <line x1="10" y1="24" x2="38" y2="24" {...STROKE} opacity="0.5" />
      <path d="M24 9 L33 22 L15 22 Z" {...STROKE} />
      <path d="M24 39 L33 26 L15 26 Z" {...STROKE} opacity="0.7" />
    </>
  ),
  // Three waves of rising frequency.
  vibration: (
    <>
      <path d="M9 17 Q 16 11, 24 17 T 39 17" {...STROKE} opacity="0.55" />
      <path d="M9 25 Q 15 18, 21 25 T 33 25 T 39 25" {...STROKE} />
      <path d="M9 33 Q 13 28, 17 33 T 25 33 T 33 33 T 39 33" {...STROKE} opacity="0.75" />
    </>
  ),
  // One axis, two poles: filled and empty ends of the same line.
  polarity: (
    <>
      <line x1="12" y1="34" x2="36" y2="14" {...STROKE} />
      <circle cx="12" cy="34" r="4.5" fill="currentColor" stroke="none" opacity="0.85" />
      <circle cx="36" cy="14" r="4.5" {...STROKE} />
    </>
  ),
  // A pendulum at three moments of its swing.
  rhythm: (
    <>
      <line x1="24" y1="9" x2="24" y2="12" {...STROKE} opacity="0.6" />
      <path d="M12 31 A 17 17 0 0 1 36 31" {...STROKE} opacity="0.4" strokeDasharray="2 3" />
      <line x1="24" y1="11" x2="15" y2="30" {...STROKE} opacity="0.45" />
      <line x1="24" y1="11" x2="33" y2="30" {...STROKE} />
      <circle cx="33" cy="32" r="3.4" {...STROKE} />
      <circle cx="15" cy="32" r="3.4" {...STROKE} opacity="0.4" />
    </>
  ),
  // A first cause branching into consequences.
  causation: (
    <>
      <circle cx="24" cy="11" r="3.4" {...STROKE} />
      <line x1="24" y1="14.5" x2="24" y2="22" {...STROKE} />
      <line x1="24" y1="22" x2="14" y2="30" {...STROKE} />
      <line x1="24" y1="22" x2="34" y2="30" {...STROKE} />
      <circle cx="14" cy="33" r="3" {...STROKE} opacity="0.75" />
      <circle cx="34" cy="33" r="3" {...STROKE} opacity="0.75" />
      <line x1="34" y1="36" x2="34" y2="40" {...STROKE} opacity="0.45" />
    </>
  ),
  // Two currents sharing a common centre: the vesica.
  gender: (
    <>
      <circle cx="19" cy="24" r="11" {...STROKE} />
      <circle cx="29" cy="24" r="11" {...STROKE} opacity="0.7" />
      <line x1="24" y1="17" x2="24" y2="31" {...STROKE} opacity="0.5" />
    </>
  ),
}

export function PrincipleSymbol({ symbol, size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      {SYMBOLS[symbol] || SYMBOLS.mentalism}
    </svg>
  )
}
