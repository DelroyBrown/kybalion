import { useState } from 'react'

import { VizButton } from './vizUtils'

/**
 * As Above, So Below. Four nested scales — personal, social, natural,
 * cosmic — each carrying the same geometric motif. Travelling between
 * levels shows the pattern recurring at every magnification.
 */
const LEVELS = [
  {
    key: 'personal', label: 'Personal', caption:
      'A single day: attention gathers at a centre, radiates into acts, returns as memory.',
  },
  {
    key: 'social', label: 'Social', caption:
      'A community: individuals orbit shared centres — households, institutions, ideas.',
  },
  {
    key: 'natural', label: 'Natural', caption:
      'A living system: the same gathering and radiating, now as watersheds, seasons, food webs.',
  },
  {
    key: 'cosmic', label: 'Cosmic', caption:
      'A galaxy: matter orbiting a centre it cannot see. The motif does not change — only the scale.',
  },
]

function Motif({ r, accentHex, opacity }) {
  const points = Array.from({ length: 7 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 7
    return [200 + r * Math.cos(angle), 170 + r * Math.sin(angle)]
  })
  return (
    <g opacity={opacity} style={{ transition: 'opacity 0.9s ease' }}>
      <circle cx="200" cy="170" r={r} fill="none" stroke={accentHex} strokeWidth="0.7" />
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={Math.max(1.6, r * 0.045)} fill="none" stroke={accentHex} strokeWidth="0.7" />
          <line x1="200" y1="170" x2={x} y2={y} stroke={accentHex} strokeWidth="0.35" opacity="0.5" />
        </g>
      ))}
    </g>
  )
}

export function CorrespondenceViz({ accentHex = '#b57f5f' }) {
  const [levelIndex, setLevelIndex] = useState(0)
  const level = LEVELS[levelIndex]

  // The viewer travels inward/outward: each level scales the whole scene.
  const scale = [1, 0.62, 0.38, 0.22][levelIndex]

  return (
    <div>
      <svg viewBox="0 0 400 340" className="w-full" role="img" aria-label={`Nested rings showing the same seven-pointed motif at the ${level.label} scale.`}>
        <g
          style={{
            transform: `scale(${1 / scale})`,
            transformOrigin: '200px 170px',
            transition: 'transform 1.1s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <Motif r={30} accentHex={accentHex} opacity={levelIndex === 0 ? 0.95 : 0.25} />
          <Motif r={64} accentHex={accentHex} opacity={levelIndex === 1 ? 0.95 : 0.25} />
          <Motif r={104} accentHex={accentHex} opacity={levelIndex === 2 ? 0.95 : 0.25} />
          <Motif r={150} accentHex={accentHex} opacity={levelIndex === 3 ? 0.95 : 0.2} />
        </g>
        <circle cx="200" cy="170" r="2" fill={accentHex} />
      </svg>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Scale">
        {LEVELS.map((entry, index) => (
          <VizButton key={entry.key} active={index === levelIndex} onClick={() => setLevelIndex(index)}>
            {entry.label}
          </VizButton>
        ))}
      </div>
      <p className="mt-3 font-serif italic text-sm text-parchment-300 leading-relaxed" aria-live="polite">
        {level.caption}
      </p>
    </div>
  )
}
