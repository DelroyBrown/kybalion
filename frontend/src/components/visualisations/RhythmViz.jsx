import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { VizSlider, useVizMotionAllowed, VizButton } from './vizUtils'

/**
 * The Pendulum. A meditative swing whose reach to one side exactly measures
 * its reach to the other. A second pendulum can be added to compare rhythms
 * of different period — cycles within cycles.
 */
export function RhythmViz({ accentHex = '#a08fb3' }) {
  const motionAllowed = useVizMotionAllowed()
  const [playing, setPlaying] = useState(motionAllowed)
  const [period, setPeriod] = useState(4)
  const [second, setSecond] = useState(false)
  const [angles, setAngles] = useState([0.6, 0.6])
  const frameRef = useRef()
  const stateRef = useRef({ period, second })
  stateRef.current = { period, second }

  useEffect(() => {
    if (!playing || !motionAllowed) return undefined
    const tick = () => {
      const t = performance.now() / 1000
      const { period: p } = stateRef.current
      setAngles([
        0.62 * Math.sin((t * 2 * Math.PI) / p),
        0.62 * Math.sin((t * 2 * Math.PI) / (p * 1.6)),
      ])
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [playing, motionAllowed])

  const pendulum = (angle, color, opacity = 1) => {
    const originX = 260
    const originY = 30
    const length = 190
    const x = originX + length * Math.sin(angle)
    const y = originY + length * Math.cos(angle)
    return (
      <g opacity={opacity}>
        <line x1={originX} y1={originY} x2={x} y2={y} stroke={color} strokeWidth="1" />
        <circle cx={x} cy={y} r="10" fill="none" stroke={color} strokeWidth="1.3" />
        <circle cx={x} cy={y} r="2.5" fill={color} />
      </g>
    )
  }

  return (
    <div>
      <svg
        viewBox="0 0 520 260"
        className="w-full"
        role="img"
        aria-label="A pendulum swinging between two equal extremes. Optionally a second, slower pendulum swings beside it for comparison."
      >
        <path d="M 100 244 A 195 195 0 0 1 420 244" fill="none" stroke="#3b3529" strokeWidth="0.8" strokeDasharray="2 5" />
        <line x1="252" y1="30" x2="268" y2="30" stroke="#655d4e" strokeWidth="2" />
        <text x="100" y="238" fill="#655d4e" style={{ font: '10px Inter, sans-serif' }}>the measure left…</text>
        <text x="420" y="238" fill="#655d4e" textAnchor="end" style={{ font: '10px Inter, sans-serif' }}>…is the measure right</text>
        {second && pendulum(angles[1], '#83718f', 0.55)}
        {pendulum(angles[0], accentHex)}
      </svg>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
        <VizSlider
          id="rhythm-period" label="Cycle length" hint="slow ↔ fast"
          min={2} max={8} step={0.5} value={10 - period}
          onChange={(value) => setPeriod(10 - value)}
        />
        <div className="flex items-center gap-2">
          <VizButton active={second} onClick={() => setSecond((value) => !value)}>
            {second ? 'Hide' : 'Compare'} second rhythm
          </VizButton>
          {motionAllowed && (
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              aria-label={playing ? 'Pause the pendulum' : 'Resume the pendulum'}
              className="p-2 border border-ink-500 rounded-sm text-parchment-300 hover:border-gold-600"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 font-sans text-xs text-parchment-500 max-w-md">
        Pause it mid-swing: the return is already implicit in the reach. The second pendulum keeps a
        different period — two rhythms agreeing only occasionally, like moods against seasons.
      </p>
    </div>
  )
}
