/**
 * A compact force-directed layout for the knowledge map (~40 nodes), small
 * enough that a dependency is unnecessary: pairwise repulsion, spring
 * attraction along edges, and gentle centering, integrated with damping.
 */
const REST_LENGTHS = {
  'principle-principle': 240,
  'passage-principle': 120,
  'passage-chapter': 95,
  default: 150,
}

export function initialPositions(nodes, width, height) {
  const centerX = width / 2
  const centerY = height / 2
  const byType = { principle: [], chapter: [], passage: [] }
  nodes.forEach((node) => (byType[node.type] || byType.passage).push(node))

  const positions = new Map()
  const place = (list, radius) => {
    list.forEach((node, index) => {
      const angle = (index / Math.max(1, list.length)) * Math.PI * 2 - Math.PI / 2
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
      })
    })
  }
  place(byType.principle, 130)
  place(byType.passage, 240)
  place(byType.chapter, 330)
  return positions
}

export function tick(positions, nodes, edges, width, height) {
  const ids = nodes.map((node) => node.id)

  // Repulsion between every pair.
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = positions.get(ids[i])
      const b = positions.get(ids[j])
      if (!a || !b) continue
      let dx = a.x - b.x
      let dy = a.y - b.y
      let distSq = dx * dx + dy * dy
      if (distSq < 1) {
        dx = Math.random() - 0.5
        dy = Math.random() - 0.5
        distSq = 1
      }
      const force = Math.min(2200 / distSq, 6)
      const dist = Math.sqrt(distSq)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }
  }

  // Springs along edges.
  const typeOf = new Map(nodes.map((node) => [node.id, node.type]))
  for (const edge of edges) {
    const a = positions.get(edge.source)
    const b = positions.get(edge.target)
    if (!a || !b) continue
    const key = [typeOf.get(edge.source), typeOf.get(edge.target)].sort().join('-')
    const rest = REST_LENGTHS[key] || REST_LENGTHS.default
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    const force = (dist - rest) * 0.012
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    a.vx += fx
    a.vy += fy
    b.vx -= fx
    b.vy -= fy
  }

  // Centering and integration.
  for (const id of ids) {
    const point = positions.get(id)
    point.vx += (width / 2 - point.x) * 0.0015
    point.vy += (height / 2 - point.y) * 0.0015
    point.vx *= 0.82
    point.vy *= 0.82
    point.x += point.vx
    point.y += point.vy
  }
}

/** Breadth-first shortest path between two node ids over the given edges. */
export function shortestPath(fromId, toId, edges) {
  const adjacency = new Map()
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, [])
    adjacency.get(edge.source).push(edge.target)
    adjacency.get(edge.target).push(edge.source)
  }
  const previous = new Map([[fromId, null]])
  const queue = [fromId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (current === toId) break
    for (const next of adjacency.get(current) || []) {
      if (!previous.has(next)) {
        previous.set(next, current)
        queue.push(next)
      }
    }
  }
  if (!previous.has(toId)) return null
  const path = []
  let cursor = toId
  while (cursor !== null) {
    path.unshift(cursor)
    cursor = previous.get(cursor)
  }
  return path
}
