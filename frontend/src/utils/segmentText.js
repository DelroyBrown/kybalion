/**
 * Split paragraph text into segments according to overlapping ranges
 * (curated passages and user highlights), so each segment can be rendered
 * with every range that covers it.
 *
 * Ranges: { start, end, type: 'passage'|'highlight', data }
 * Returns: [{ text, start, end, ranges: [range, ...] }]
 */
export function segmentText(text, ranges) {
  const valid = (ranges || []).filter(
    (r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.start < r.end && r.start >= 0 && r.end <= text.length
  )
  if (valid.length === 0) {
    return [{ text, start: 0, end: text.length, ranges: [] }]
  }

  const boundaries = new Set([0, text.length])
  for (const range of valid) {
    boundaries.add(range.start)
    boundaries.add(range.end)
  }
  const points = [...boundaries].sort((a, b) => a - b)

  const segments = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i]
    const end = points[i + 1]
    if (start === end) continue
    const covering = valid.filter((r) => r.start <= start && r.end >= end)
    segments.push({ text: text.slice(start, end), start, end, ranges: covering })
  }
  return segments
}

/**
 * Character offsets of the current DOM selection inside a paragraph element
 * whose text nodes live in spans carrying data-seg-start attributes.
 * Returns { start, end } or null when the selection is empty / outside.
 */
export function selectionOffsetsWithin(paragraphEl) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null
  const range = selection.getRangeAt(0)
  if (!paragraphEl.contains(range.startContainer) || !paragraphEl.contains(range.endContainer)) return null

  const offsetOf = (container, offset) => {
    let node = container.nodeType === Node.TEXT_NODE ? container.parentElement : container
    while (node && node !== paragraphEl && !node.dataset?.segStart) {
      node = node.parentElement
    }
    if (!node || node === paragraphEl) return null
    return Number(node.dataset.segStart) + offset
  }

  const start = offsetOf(range.startContainer, range.startOffset)
  const end = offsetOf(range.endContainer, range.endOffset)
  if (start == null || end == null || start === end) return null
  return { start: Math.min(start, end), end: Math.max(start, end) }
}
