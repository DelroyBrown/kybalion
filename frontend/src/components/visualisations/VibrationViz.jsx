import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { VizSlider, useVizMotionAllowed } from './vizUtils'

/**
 * The Moving Stillness. Two waves and their combination. Frequency is the
 * rate of change, amplitude its reach, harmony how the second wave relates
 * to the first — in step, it reinforces; out of step, it cancels.
 */
export function VibrationViz({ accentHex = '#c99a5b' }) {
  const canvasRef = useRef(null)
  const motionAllowed = useVizMotionAllowed()
  const [playing, setPlaying] = useState(motionAllowed)
  const [frequency, setFrequency] = useState(2)
  const [amplitude, setAmplitude] = useState(30)
  const [harmony, setHarmony] = useState(100)
  const stateRef = useRef({ frequency, amplitude, harmony })
  stateRef.current = { frequency, amplitude, harmony }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const width = 560
    const height = 260
    canvas.width = width * ratio
    canvas.height = height * ratio
    context.scale(ratio, ratio)

    let frame
    const draw = (time) => {
      const { frequency: freq, amplitude: amp, harmony: harm } = stateRef.current
      const t = playing && motionAllowed ? time / 1000 : 0
      context.clearRect(0, 0, width, height)

      const rows = [
        { y: 55, phase: 0, color: `${accentHex}99`, label: 'first wave' },
        { y: 125, phase: (1 - harm / 100) * Math.PI, color: '#a08fb399', label: 'second wave' },
      ]
      const waveAt = (x, row) =>
        Math.sin((x / width) * Math.PI * 2 * freq + t * 1.6 + row.phase) * amp * 0.55

      for (const row of rows) {
        context.beginPath()
        for (let x = 0; x <= width; x += 2) {
          const y = row.y + waveAt(x, row)
          if (x === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.strokeStyle = row.color
        context.lineWidth = 1.2
        context.stroke()
      }

      // Their combination
      context.beginPath()
      for (let x = 0; x <= width; x += 2) {
        const y = 205 + (waveAt(x, rows[0]) + waveAt(x, rows[1])) * 0.75
        if (x === 0) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.strokeStyle = accentHex
      context.lineWidth = 1.8
      context.stroke()

      context.fillStyle = '#837863'
      context.font = '10px Inter, sans-serif'
      context.fillText('first wave', 8, 22)
      context.fillText('second wave', 8, 92)
      context.fillText('together', 8, 172)

      if (playing && motionAllowed) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [playing, motionAllowed, accentHex])

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: 560 }}
        role="img"
        aria-label="Two waves and their combined form. Adjusting harmony moves them into and out of step, reinforcing or cancelling the combined wave."
      />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <VizSlider
          id="viz-frequency" label="Frequency" hint="how fast states change"
          min={1} max={6} step={0.5} value={frequency} onChange={setFrequency}
        />
        <VizSlider
          id="viz-amplitude" label="Amplitude" hint="how strongly they swing"
          min={8} max={60} step={1} value={amplitude} onChange={setAmplitude}
        />
        <VizSlider
          id="viz-harmony" label="Harmony" hint="in step ↔ in conflict"
          min={0} max={100} step={1} value={harmony} onChange={setHarmony}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-sans text-xs text-parchment-500 max-w-md">
          When the two waves agree they amplify one another; opposed, they flatten each other out —
          interference, offered here as a metaphor for states of mind meeting.
        </p>
        {motionAllowed && (
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? 'Pause motion' : 'Resume motion'}
            className="p-2 border border-ink-500 rounded-sm text-parchment-300 hover:border-gold-600"
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
