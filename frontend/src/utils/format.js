const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI']

export function toRoman(number) {
  return ROMAN[number] || String(number)
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDuration(totalSeconds) {
  const minutes = Math.round((totalSeconds || 0) / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${minutes % 60} min`
}

export function truncate(text, length = 120) {
  if (!text || text.length <= length) return text || ''
  return `${text.slice(0, length).trimEnd()}…`
}
