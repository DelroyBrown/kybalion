import { Suspense, lazy } from 'react'

import { TextSkeleton } from '../common/states'

const REGISTRY = {
  mentalism: lazy(() => import('./MentalismViz').then((m) => ({ default: m.MentalismViz }))),
  correspondence: lazy(() => import('./CorrespondenceViz').then((m) => ({ default: m.CorrespondenceViz }))),
  vibration: lazy(() => import('./VibrationViz').then((m) => ({ default: m.VibrationViz }))),
  polarity: lazy(() => import('./PolarityViz').then((m) => ({ default: m.PolarityViz }))),
  rhythm: lazy(() => import('./RhythmViz').then((m) => ({ default: m.RhythmViz }))),
  causation: lazy(() => import('./CausationViz').then((m) => ({ default: m.CausationViz }))),
  gender: lazy(() => import('./GenderViz').then((m) => ({ default: m.GenderViz }))),
}

/**
 * Wraps every interactive visualisation with its framing: a title, an
 * honesty line (these are conceptual interpretations, not demonstrations),
 * and an accessible written alternative.
 */
export function VisualisationFrame({ componentKey, title, description, accentHex }) {
  const Component = REGISTRY[componentKey]
  if (!Component) return null

  return (
    <figure className="border hairline rounded-sm overflow-hidden">
      <figcaption className="px-5 pt-4 pb-3 border-b hairline flex items-baseline justify-between gap-4">
        <span className="font-display text-lg text-parchment-100">{title}</span>
        <span className="font-sans text-[0.6875rem] text-parchment-500 text-right">
          A conceptual interpretation — not a scientific demonstration
        </span>
      </figcaption>
      <div className="p-5">
        <Suspense fallback={<TextSkeleton lines={5} />}>
          <Component accentHex={accentHex} />
        </Suspense>
      </div>
      {description && (
        <details className="border-t hairline px-5 py-3">
          <summary className="cursor-pointer font-sans text-xs text-parchment-400 hover:text-parchment-200">
            Read this visualisation as text
          </summary>
          <p className="editorial-body mt-2 pb-2">{description}</p>
        </details>
      )}
    </figure>
  )
}
