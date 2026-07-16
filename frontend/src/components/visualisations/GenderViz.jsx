import { useMemo, useState } from 'react'

import { VizSlider } from './vizUtils'

/**
 * The Two Currents. A generative current (impulse, initiation) and a
 * receptive current (development, formation) intertwine; the circle of
 * completed work closes only when both contribute. The historical
 * masculine/feminine vocabulary is deliberately not used here — the
 * principle concerns functions, not people.
 */
export function GenderViz({ accentHex = '#7d5f76' }) {
  const [balance, setBalance] = useState(50)

  // Completion peaks when the currents are balanced.
  const completion = useMemo(() => 1 - Math.abs(balance - 50) / 50, [balance])
  const generativeStrength = 0.35 + ((100 - balance) / 100) * 0.65
  const receptiveStrength = 0.35 + (balance / 100) * 0.65

  const wavePath = (phase, amplitude) => {
    let path = ''
    for (let x = 0; x <= 360; x += 6) {
      const y = 110 + Math.sin((x / 360) * Math.PI * 3 + phase) * amplitude
      path += x === 0 ? `M ${x + 20} ${y}` : ` L ${x + 20} ${y}`
    }
    return path
  }

  const circumference = 2 * Math.PI * 34

  return (
    <div>
      <svg
        viewBox="0 0 520 220"
        className="w-full"
        role="img"
        aria-label="Two intertwined currents — generative and receptive — feeding a circle that closes only when both flow in balance."
      >
        <path
          d={wavePath(0, 26 * generativeStrength)}
          fill="none" stroke="#bfa05d" strokeWidth={1 + generativeStrength * 1.6}
          opacity={0.35 + generativeStrength * 0.6}
          style={{ transition: 'all 0.5s ease' }}
        />
        <path
          d={wavePath(Math.PI, 26 * receptiveStrength)}
          fill="none" stroke={accentHex} strokeWidth={1 + receptiveStrength * 1.6}
          opacity={0.35 + receptiveStrength * 0.6}
          style={{ transition: 'all 0.5s ease' }}
        />
        <line x1="380" y1="110" x2="415" y2="110" stroke="#655d4e" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* The work: a circle that closes with balance */}
        <circle cx="455" cy="110" r="34" fill="none" stroke="#3b3529" strokeWidth="1" />
        <circle
          cx="455" cy="110" r="34" fill="none"
          stroke="#d3b878" strokeWidth="1.6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - completion)}
          transform="rotate(-90 455 110)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="455" y="110" textAnchor="middle" dominantBaseline="central" fill="#c3b596" style={{ font: 'italic 11px "EB Garamond", serif' }}>
          {Math.round(completion * 100)}%
        </text>
        <text x="455" y="165" textAnchor="middle" fill="#837863" style={{ font: '10px Inter, sans-serif' }}>
          the finished work
        </text>
        <text x="30" y="40" fill="#bfa05d" style={{ font: '10px Inter, sans-serif' }}>generative — begins, projects, initiates</text>
        <text x="30" y="196" fill="#a08fb3" style={{ font: '10px Inter, sans-serif' }}>receptive — develops, gestates, completes</text>
      </svg>

      <div className="mt-4 max-w-md">
        <VizSlider
          id="gender-balance" label="Where the energy goes" hint="all beginning ↔ all finishing"
          min={0} max={100} step={1} value={balance} onChange={setBalance}
        />
      </div>
      <p className="mt-3 font-sans text-xs text-parchment-500 max-w-lg" aria-live="polite">
        {balance < 25 && 'All impulse, no development: many beginnings, nothing carried to form.'}
        {balance >= 25 && balance <= 75 && 'Both currents flowing: initiation received, developed, and brought to completion.'}
        {balance > 75 && 'All development, no new impulse: refinement with nothing fresh to refine.'}
      </p>
      <p className="mt-2 font-sans text-[0.6875rem] text-parchment-500">
        These are functions present in every person and process — the 1908 text's gendered
        vocabulary describes creative operations, not people or identities.
      </p>
    </div>
  )
}
