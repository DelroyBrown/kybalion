/**
 * Design-token accents used by principles and annotation types.
 * Keys arrive from the API (`accent` fields); values are Tailwind-safe
 * class fragments and raw colours for SVG work.
 */
export const ACCENTS = {
  gold: { text: 'text-gold-300', border: 'border-gold-600', hex: '#bfa05d', dim: 'rgba(191,160,93,0.14)' },
  bronze: { text: 'text-bronze-400', border: 'border-bronze-600', hex: '#a98763', dim: 'rgba(169,135,99,0.14)' },
  copper: { text: 'text-copper-400', border: 'border-copper-600', hex: '#b57f5f', dim: 'rgba(181,127,95,0.14)' },
  amber: { text: 'text-amber-400', border: 'border-amber-500', hex: '#c99a5b', dim: 'rgba(201,154,91,0.14)' },
  crimson: { text: 'text-crimson-300', border: 'border-crimson-500', hex: '#b56a6d', dim: 'rgba(181,106,109,0.14)' },
  violet: { text: 'text-violet-300', border: 'border-violet-500', hex: '#a08fb3', dim: 'rgba(160,143,179,0.14)' },
  plum: { text: 'text-plum-400', border: 'border-plum-500', hex: '#7d5f76', dim: 'rgba(125,95,118,0.16)' },
  parchment: { text: 'text-parchment-300', border: 'border-parchment-500', hex: '#c3b596', dim: 'rgba(195,181,150,0.12)' },
  sage: { text: 'text-sage-400', border: 'border-sage-500', hex: '#8a9478', dim: 'rgba(138,148,120,0.14)' },
}

export function accent(key) {
  return ACCENTS[key] || ACCENTS.gold
}
