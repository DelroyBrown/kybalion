import { useMemo, useState } from 'react'

/**
 * The Field of Mind. A central idea surrounded by the faculties that carry
 * it — perception, interpretation, intention, action, memory, mood. Touch
 * any node and its influence spreads through the connected field,
 * illustrating (conceptually) how one change of mind propagates.
 */
const NODES = [
  { id: 'center', label: 'the idea', x: 260, y: 170, fixed: true },
  { id: 'perception', label: 'perception', x: 110, y: 80 },
  { id: 'interpretation', label: 'interpretation', x: 410, y: 80 },
  { id: 'intention', label: 'intention', x: 450, y: 220 },
  { id: 'action', label: 'action', x: 330, y: 300 },
  { id: 'memory', label: 'memory', x: 160, y: 300 },
  { id: 'mood', label: 'mood', x: 70, y: 210 },
]

const EDGES = [
  ['center', 'perception'], ['center', 'interpretation'], ['center', 'intention'],
  ['center', 'action'], ['center', 'memory'], ['center', 'mood'],
  ['perception', 'interpretation'], ['interpretation', 'intention'], ['intention', 'action'],
  ['action', 'memory'], ['memory', 'mood'], ['mood', 'perception'],
]

function neighbourMap() {
  const map = new Map()
  for (const [a, b] of EDGES) {
    if (!map.has(a)) map.set(a, [])
    if (!map.has(b)) map.set(b, [])
    map.get(a).push(b)
    map.get(b).push(a)
  }
  return map
}

export function MentalismViz({ accentHex = '#bfa05d' }) {
  const [focusId, setFocusId] = useState('center')
  const [idea, setIdea] = useState('')
  const neighbours = useMemo(neighbourMap, [])

  // Influence spreads outward from the focused node, fading with distance.
  const activation = useMemo(() => {
    const levels = new Map([[focusId, 1]])
    const queue = [focusId]
    while (queue.length > 0) {
      const current = queue.shift()
      const strength = levels.get(current)
      for (const next of neighbours.get(current) || []) {
        if (!levels.has(next)) {
          levels.set(next, strength * 0.55)
          queue.push(next)
        }
      }
    }
    return levels
  }, [focusId, neighbours])

  const nodeById = Object.fromEntries(NODES.map((node) => [node.id, node]))

  return (
    <div>
      <svg viewBox="0 0 520 360" className="w-full" role="img" aria-label="A field of connected mental faculties. Selecting one strengthens it and its influence spreads to its neighbours.">
        {EDGES.map(([a, b]) => {
          const strength = Math.min(activation.get(a) || 0, activation.get(b) || 0)
          return (
            <line
              key={`${a}-${b}`}
              x1={nodeById[a].x} y1={nodeById[a].y}
              x2={nodeById[b].x} y2={nodeById[b].y}
              stroke={accentHex}
              strokeWidth={0.6 + strength * 1.4}
              opacity={0.12 + strength * 0.5}
              style={{ transition: 'opacity 0.8s ease, stroke-width 0.8s ease' }}
            />
          )
        })}
        {NODES.map((node) => {
          const strength = activation.get(node.id) || 0
          const radius = node.fixed ? 26 : 16 + strength * 12
          return (
            <g key={node.id}>
              <circle
                cx={node.x} cy={node.y} r={radius}
                fill={strength > 0.9 ? `${accentHex}22` : 'transparent'}
                stroke={accentHex}
                strokeWidth={strength > 0.9 ? 1.4 : 0.8}
                opacity={0.35 + strength * 0.65}
                style={{ transition: 'all 0.8s ease', cursor: 'pointer' }}
                onClick={() => setFocusId(node.id)}
                role="button"
                tabIndex={0}
                aria-label={`Focus on ${node.label}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setFocusId(node.id)
                  }
                }}
              />
              <text
                x={node.x} y={node.y + (node.fixed ? 0 : radius + 16)}
                textAnchor="middle" dominantBaseline={node.fixed ? 'central' : 'auto'}
                fill="#c3b596"
                opacity={0.5 + strength * 0.5}
                style={{ font: node.fixed ? 'italic 13px "EB Garamond", serif' : '10px Inter, sans-serif', transition: 'opacity 0.8s ease', pointerEvents: 'none' }}
              >
                {node.fixed && idea ? idea : node.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1">
          <label htmlFor="mentalism-idea" className="font-sans text-xs text-parchment-300">
            Name the idea at the centre of your attention
          </label>
          <input
            id="mentalism-idea"
            type="text"
            maxLength={24}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="e.g. the difficult conversation"
            className="mt-1.5 w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 font-serif text-sm text-parchment-100 placeholder:text-parchment-600"
          />
        </div>
        <p className="font-sans text-xs text-parchment-500 flex-1">
          Select any faculty to shift the field's centre of gravity. Notice that nothing changes in
          isolation — the claim this figure illustrates.
        </p>
      </div>
    </div>
  )
}
