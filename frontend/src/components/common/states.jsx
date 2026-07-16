import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import { Sigil } from './Sigil'
import { Button } from './Button'

/** Empty state: quiet copy plus one useful next action. */
export function EmptyState({ symbol = true, title, body, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      {symbol && <Sigil size={64} className="text-ink-500 mb-6" />}
      <h3 className="font-display text-xl text-parchment-200">{title}</h3>
      {body && <p className="editorial-body mt-2 max-w-sm text-parchment-400">{body}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-6">
          <Button variant="outline">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ title = 'Something went astray', error, onRetry }) {
  const detail =
    typeof error?.detail === 'string'
      ? error.detail
      : error?.message || 'The request could not be completed.'
  return (
    <div className="flex flex-col items-center text-center py-16 px-6" role="alert">
      <AlertTriangle size={28} className="text-crimson-300 mb-4" aria-hidden="true" />
      <h3 className="font-display text-xl text-parchment-200">{title}</h3>
      <p className="editorial-body mt-2 max-w-sm text-parchment-400">{detail}</p>
      {import.meta.env.DEV && error?.status && (
        <p className="mt-2 font-mono text-xs text-parchment-500">
          {error.status} {error.code}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Skeleton shaped like book text rather than a generic spinner. */
export function TextSkeleton({ lines = 6 }) {
  const widths = ['w-full', 'w-11/12', 'w-full', 'w-10/12', 'w-full', 'w-9/12', 'w-full', 'w-8/12']
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3.5 rounded-sm bg-ink-700/70 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

export function LoadingVeil({ label = 'Preparing the text' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
      <Sigil size={72} animated className="text-gold-500" />
      <p className="caps-label text-parchment-500 mt-6">{label}</p>
    </div>
  )
}
