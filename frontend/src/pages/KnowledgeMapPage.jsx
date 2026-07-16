import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, RotateCcw, Route, X } from 'lucide-react'

import { useKnowledgeGraph } from '../api/principles'
import { IconButton } from '../components/common/Button'
import { ErrorState, LoadingVeil } from '../components/common/states'
import { initialPositions, shortestPath, tick } from '../components/map/forceLayout'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cn } from '../utils/cn'
import { accent } from '../utils/accents'
import { truncate } from '../utils/format'

const WORLD = { width: 1200, height: 800 }
const NODE_STYLE = {
  principle: { radius: 26, color: '#bfa05d' },
  chapter: { radius: 12, color: '#83718f' },
  passage: { radius: 7, color: '#96654a' },
}
const TYPE_FILTERS = [
  { key: 'principle', label: 'Principles' },
  { key: 'chapter', label: 'Chapters' },
  { key: 'passage', label: 'Passages' },
]

function nodeRoute(node) {
  if (node.type === 'principle') return `/principles/${node.slug}`
  if (node.type === 'chapter') return `/read/${node.slug}`
  return `/read/${node.chapter}?passage=${node.slug}`
}

export function KnowledgeMapPage() {
  useDocumentTitle('Knowledge Map')
  const navigate = useNavigate()
  const { data: graph, isLoading, isError, error, refetch } = useKnowledgeGraph()

  const [types, setTypes] = useState({ principle: true, chapter: true, passage: true })
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [pathMode, setPathMode] = useState(false)
  const [pathIds, setPathIds] = useState(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [, forceRender] = useState(0)

  const svgRef = useRef(null)
  const positionsRef = useRef(new Map())
  const dragRef = useRef(null)
  const lastDragMovedRef = useRef(false)

  const filtered = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    const nodes = graph.nodes.filter((node) => types[node.type])
    const visible = new Set(nodes.map((node) => node.id))
    const edges = graph.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target))
    return { nodes, edges }
  }, [graph, types])

  // Settle the layout with an animated simulation, then hold still.
  useEffect(() => {
    if (filtered.nodes.length === 0) return undefined
    positionsRef.current = initialPositions(filtered.nodes, WORLD.width, WORLD.height)
    let ticks = 0
    let frame
    const run = () => {
      for (let i = 0; i < 4; i += 1) {
        tick(positionsRef.current, filtered.nodes, filtered.edges, WORLD.width, WORLD.height)
      }
      ticks += 4
      forceRender((value) => value + 1)
      if (ticks < 320) frame = requestAnimationFrame(run)
    }
    frame = requestAnimationFrame(run)
    return () => cancelAnimationFrame(frame)
  }, [filtered])

  // Wheel zoom needs a non-passive listener.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    const onWheel = (event) => {
      event.preventDefault()
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
      setView((current) => ({ ...current, scale: Math.min(4, Math.max(0.35, current.scale * factor)) }))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  const neighbourIds = useMemo(() => {
    if (!selectedId) return null
    const set = new Set([selectedId])
    for (const edge of filtered.edges) {
      if (edge.source === selectedId) set.add(edge.target)
      if (edge.target === selectedId) set.add(edge.source)
    }
    return set
  }, [selectedId, filtered.edges])

  const matchIds = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return null
    return new Set(
      filtered.nodes.filter((node) => node.label.toLowerCase().includes(trimmed)).map((node) => node.id)
    )
  }, [query, filtered.nodes])

  const selectedNode = filtered.nodes.find((node) => node.id === selectedId)
  const pathSet = pathIds ? new Set(pathIds) : null

  const onNodeClick = (node) => {
    if (pathMode && selectedId && selectedId !== node.id) {
      const path = shortestPath(selectedId, node.id, filtered.edges)
      setPathIds(path)
      setPathMode(false)
      return
    }
    setPathIds(null)
    setSelectedId(node.id === selectedId ? null : node.id)
  }

  const onPointerDown = (event, node) => {
    event.stopPropagation()
    dragRef.current = { kind: node ? 'node' : 'pan', id: node?.id, startX: event.clientX, startY: event.clientY, moved: false, view: { ...view } }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
    if (drag.kind === 'pan') {
      setView({ ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy })
    } else {
      const point = positionsRef.current.get(drag.id)
      if (point) {
        point.x += (event.movementX || 0) / view.scale
        point.y += (event.movementY || 0) / view.scale
        forceRender((value) => value + 1)
      }
    }
  }

  const onPointerUp = () => {
    lastDragMovedRef.current = Boolean(dragRef.current?.moved)
    dragRef.current = null
  }

  if (isLoading) return <LoadingVeil label="Drawing the map" />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  const positions = positionsRef.current

  const nodeOpacity = (node) => {
    if (pathSet) return pathSet.has(node.id) ? 1 : 0.12
    if (neighbourIds) return neighbourIds.has(node.id) ? 1 : 0.15
    if (matchIds) return matchIds.has(node.id) ? 1 : 0.15
    return 1
  }

  const edgeVisible = (edge) => {
    if (pathSet) {
      const index = pathIds.indexOf(edge.source)
      return index !== -1 && (pathIds[index + 1] === edge.target || pathIds[index - 1] === edge.target)
    }
    if (neighbourIds) return edge.source === selectedId || edge.target === selectedId
    return true
  }

  return (
    <div className="flex flex-col h-dvh lg:h-screen">
      <header className="px-5 sm:px-8 pt-8 pb-4">
        <h1 className="font-display font-light text-2xl sm:text-3xl text-parchment-100">Knowledge Map</h1>
        <p className="editorial-body mt-1 text-parchment-500">
          Principles, chapters, and passages — and every thread between them. Drag to explore, select
          a node to focus, or trace the shortest path between two ideas.
        </p>
      </header>

      {/* Controls */}
      <div className="px-5 sm:px-8 pb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="map-search" className="sr-only">Search the map</label>
        <input
          id="map-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search nodes…"
          className="bg-ink-900 border border-ink-600 rounded-sm px-3 py-1.5 font-sans text-xs text-parchment-200 placeholder:text-parchment-600 w-40"
        />
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            aria-pressed={types[filter.key]}
            onClick={() => setTypes((current) => ({ ...current, [filter.key]: !current[filter.key] }))}
            className={cn(
              'rounded-sm border px-2.5 py-1.5 font-sans text-xs transition-colors',
              types[filter.key]
                ? 'border-gold-600 text-gold-200'
                : 'border-ink-600 text-parchment-500 hover:text-parchment-300'
            )}
          >
            {filter.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={pathMode}
          onClick={() => {
            setPathMode((value) => !value)
            setPathIds(null)
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 font-sans text-xs transition-colors',
            pathMode ? 'border-gold-500 text-gold-200 bg-gold-500/10' : 'border-ink-600 text-parchment-400'
          )}
          title="Select a node, then a second node, to trace the shortest path"
        >
          <Route size={12} aria-hidden="true" /> {pathMode ? 'Now pick the second node…' : 'Shortest path'}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Zoom in" onClick={() => setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.25) }))}>
            <Plus size={14} />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => setView((v) => ({ ...v, scale: Math.max(0.35, v.scale / 1.25) }))}>
            <Minus size={14} />
          </IconButton>
          <IconButton label="Reset view" onClick={() => { setView({ x: 0, y: 0, scale: 1 }); setSelectedId(null); setPathIds(null); setQuery('') }}>
            <RotateCcw size={14} />
          </IconButton>
        </div>
      </div>

      {/* The map */}
      <div className="relative flex-1 min-h-[24rem] mx-5 sm:mx-8 mb-6 border hairline rounded-sm overflow-hidden bg-ink-900/50">
        <svg
          ref={svgRef}
          className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
          viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
          role="application"
          aria-label="Interactive knowledge map. A text alternative is provided below."
          onPointerDown={(event) => onPointerDown(event, null)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`} style={{ transformOrigin: 'center' }}>
            {filtered.edges.map((edge, index) => {
              const a = positions.get(edge.source)
              const b = positions.get(edge.target)
              if (!a || !b) return null
              const highlighted = pathSet && edgeVisible(edge)
              return (
                <line
                  key={index}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={highlighted ? '#d3b878' : '#bfa05d'}
                  strokeWidth={highlighted ? 1.6 : 0.5}
                  opacity={edgeVisible(edge) ? (highlighted ? 0.9 : 0.22) : 0.04}
                />
              )
            })}
            {filtered.nodes.map((node) => {
              const point = positions.get(node.id)
              if (!point) return null
              const style = NODE_STYLE[node.type]
              const color = node.type === 'principle' ? accent(node.accent).hex : style.color
              const opacity = nodeOpacity(node)
              return (
                <g
                  key={node.id}
                  transform={`translate(${point.x} ${point.y})`}
                  opacity={opacity}
                  style={{ transition: 'opacity 0.35s ease', cursor: 'pointer' }}
                  onPointerDown={(event) => onPointerDown(event, node)}
                  onClick={() => {
                    if (!lastDragMovedRef.current) onNodeClick(node)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.type}: ${node.label}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onNodeClick(node)
                  }}
                >
                  <circle
                    r={style.radius}
                    fill={node.id === selectedId ? `${color}2e` : 'transparent'}
                    stroke={color}
                    strokeWidth={node.id === selectedId ? 1.8 : 1}
                  />
                  {node.type === 'principle' && (
                    <circle r={style.radius - 6} fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" />
                  )}
                  <text
                    y={style.radius + 14}
                    textAnchor="middle"
                    fill="#c3b596"
                    opacity={node.type === 'passage' ? 0.65 : 0.9}
                    style={{ font: `${node.type === 'principle' ? 12 : 10}px Inter, sans-serif`, pointerEvents: 'none' }}
                  >
                    {truncate(node.label.replace('The Principle of ', ''), node.type === 'passage' ? 26 : 30)}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Focus card */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-ink-850/95 border border-ink-600 rounded-sm p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="caps-label text-parchment-500">{selectedNode.type}</p>
                <p className="mt-1 font-serif text-parchment-100 leading-snug">{selectedNode.label}</p>
                {selectedNode.summary && (
                  <p className="editorial-body mt-1.5 text-sm text-parchment-400">{truncate(selectedNode.summary, 110)}</p>
                )}
              </div>
              <IconButton label="Clear selection" onClick={() => { setSelectedId(null); setPathIds(null) }}>
                <X size={14} />
              </IconButton>
            </div>
            <button
              type="button"
              onClick={() => navigate(nodeRoute(selectedNode))}
              className="mt-3 font-sans text-xs tracking-caps uppercase text-gold-300 hover:text-gold-200"
            >
              Open {selectedNode.type === 'passage' ? 'in reader' : ''} →
            </button>
          </div>
        )}
      </div>

      {/* Accessible alternative */}
      <details className="mx-5 sm:mx-8 mb-10 border hairline rounded-sm">
        <summary className="cursor-pointer px-5 py-3 font-sans text-sm text-parchment-300 hover:text-parchment-100">
          Browse the map as a list
        </summary>
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TYPE_FILTERS.map((filter) => (
            <div key={filter.key}>
              <h2 className="caps-label text-gold-400 mb-2">{filter.label}</h2>
              <ul className="space-y-1.5">
                {(graph?.nodes || [])
                  .filter((node) => node.type === filter.key)
                  .map((node) => (
                    <li key={node.id}>
                      <Link
                        to={nodeRoute(node)}
                        className="font-sans text-sm text-parchment-300 hover:text-gold-200 underline decoration-dotted underline-offset-4"
                      >
                        {truncate(node.label, 60)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
