import { useState } from 'react'

import { VizButton } from './vizUtils'

/**
 * One Axis, Two Ends. A continuous scale between named opposites. Moving
 * the marker reframes the "opposites" as degrees of a single quality —
 * with the caution that this is an analogy, strongest for some pairs and
 * weakest for others.
 */
const AXES = [
  {
    key: 'temperature', a: 'Cold', b: 'Heat',
    readings: [
      'Deep cold: the scale\'s far end — yet still a temperature, not a different substance.',
      'Cool shading toward warm: no line is crossed; only degrees pass.',
      'The middle: where would "cold" end and "heat" begin? The question dissolves.',
      'Warmth rising: the same quality, further along.',
      'Great heat: the opposite pole — of one and the same scale.',
    ],
    note: 'Temperature is the book\'s cleanest case: the two poles genuinely are one measurable quality.',
  },
  {
    key: 'light', a: 'Darkness', b: 'Light',
    readings: [
      'Darkness: described by the book as no thing in itself — the absence end of one scale.',
      'First greys: degree, not boundary.',
      'Dusk: the point where naming either pole feels arbitrary.',
      'Brightening: the same axis, walked further.',
      'Full light: the other end of a single continuum.',
    ],
    note: 'Physically, darkness is absence of light rather than its opposite substance — which is the book\'s own point.',
  },
  {
    key: 'feeling', a: 'Fear', b: 'Courage',
    readings: [
      'Dread: the contracted end of the axis.',
      'Apprehension: already a degree less contracted — movement is possible.',
      'Readiness: the crossing point where energy can turn either way.',
      'Resolve: the same energy, now expansive.',
      'Courage: not the absence of fear but, on this framing, its transmutation.',
    ],
    note: 'Emotional "poles" are an analogy, not a measurement — useful for finding the next degree, not for arithmetic.',
  },
  {
    key: 'motion', a: 'Stillness', b: 'Motion',
    readings: [
      'Apparent rest: stillness at one scale conceals motion at another.',
      'Slow drift: the first visible degrees.',
      'Measured movement: rate, not kind, is what has changed.',
      'Quickening: further along the same scale.',
      'Full motion: what stillness was, sped up.',
    ],
    note: 'This pair leans on the Principle of Vibration: rest and motion as rates of one process.',
  },
]

export function PolarityViz({ accentHex = '#b56a6d' }) {
  const [axisIndex, setAxisIndex] = useState(0)
  const [position, setPosition] = useState(50)
  const axis = AXES[axisIndex]
  const reading = axis.readings[Math.min(4, Math.floor(position / 20.01))]

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pair of opposites">
        {AXES.map((entry, index) => (
          <VizButton key={entry.key} active={index === axisIndex} onClick={() => { setAxisIndex(index); setPosition(50) }}>
            {entry.a} · {entry.b}
          </VizButton>
        ))}
      </div>

      <div className="mt-6">
        <svg viewBox="0 0 560 90" className="w-full" aria-hidden="true">
          <defs>
            <linearGradient id="polarity-gradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#1a1714" />
              <stop offset="100%" stopColor={accentHex} />
            </linearGradient>
          </defs>
          <rect x="20" y="40" width="520" height="3" rx="1.5" fill="url(#polarity-gradient)" />
          {[0, 25, 50, 75, 100].map((tick) => (
            <line key={tick} x1={20 + tick * 5.2} y1="36" x2={20 + tick * 5.2} y2="48" stroke="#3b3529" strokeWidth="1" />
          ))}
          <circle cx={20 + position * 5.2} cy="41.5" r="9" fill="none" stroke={accentHex} strokeWidth="1.4" style={{ transition: 'cx 0.15s linear' }} />
          <circle cx={20 + position * 5.2} cy="41.5" r="2.5" fill={accentHex} style={{ transition: 'cx 0.15s linear' }} />
          <text x="20" y="75" fill="#837863" style={{ font: '11px Inter, sans-serif' }}>{axis.a}</text>
          <text x="540" y="75" fill="#c3b596" textAnchor="end" style={{ font: '11px Inter, sans-serif' }}>{axis.b}</text>
        </svg>
        <label htmlFor="polarity-slider" className="sr-only">
          Position between {axis.a} and {axis.b}
        </label>
        <input
          id="polarity-slider"
          type="range" min={0} max={100} step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="w-full accent-[#b56a6d] -mt-2"
        />
      </div>

      <p className="mt-3 font-serif italic text-sm text-parchment-200 leading-relaxed min-h-[2.5rem]" aria-live="polite">
        {reading}
      </p>
      <p className="mt-2 font-sans text-xs text-parchment-500">{axis.note}</p>
    </div>
  )
}
