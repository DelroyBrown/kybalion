import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { usePrinciples } from '../api/principles'
import { Reveal } from '../components/common/Reveal'
import { ErrorState, LoadingVeil } from '../components/common/states'
import { PrincipleSymbol } from '../components/principles/PrincipleSymbol'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { accent } from '../utils/accents'
import { EASE } from '../utils/motion'

/**
 * The Seven Principles. A ring of seven symbols above, an editorial column
 * of summaries below — both routes into the same seven rooms.
 */
export function PrinciplesPage() {
  useDocumentTitle('The Seven Principles')
  const { data: principles, isLoading, isError, error, refetch } = usePrinciples()

  if (isLoading) return <LoadingVeil label="Gathering the principles" />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  const ringPosition = (index, total) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
    return { left: `${50 + 40 * Math.cos(angle)}%`, top: `${50 + 40 * Math.sin(angle)}%` }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 lg:py-16">
      <header className="text-center">
        <p className="caps-label text-parchment-500">The framework of the teaching</p>
        <h1 className="mt-3 font-display font-light text-3xl sm:text-4xl text-parchment-100">
          The Seven Principles
        </h1>
        <p className="editorial-body mt-4 max-w-xl mx-auto text-parchment-400">
          “The Principles of Truth are Seven” — the book's own claim for the axioms below. Each
          opens into explanations, examples, misreadings worth avoiding, and an interactive figure.
        </p>
      </header>

      {/* The ring — a constellation of the seven */}
      <div className="relative mx-auto mt-12 hidden sm:block" style={{ width: 'min(28rem, 80vw)', aspectRatio: '1' }}>
        <div className="absolute inset-[12%] rounded-full border hairline" aria-hidden="true" />
        {principles.map((principle, index) => {
          const position = ringPosition(index, principles.length)
          const tone = accent(principle.accent)
          return (
            <motion.div
              key={principle.slug}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={position}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: EASE }}
            >
              <Link
                to={`/principles/${principle.slug}`}
                className="group flex flex-col items-center gap-2"
                aria-label={principle.name}
              >
                <span
                  className={`flex items-center justify-center h-16 w-16 rounded-full border bg-ink-900/80 transition-colors group-hover:border-current ${tone.text}`}
                  style={{ borderColor: 'rgba(191,160,93,0.25)' }}
                >
                  <PrincipleSymbol symbol={principle.symbol} size={34} />
                </span>
                <span className="font-sans text-[0.625rem] tracking-caps uppercase text-parchment-500 group-hover:text-parchment-200 transition-colors whitespace-nowrap">
                  {principle.name.replace('The Principle of ', '')}
                </span>
              </Link>
            </motion.div>
          )
        })}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center" aria-hidden="true">
          <span className="font-display text-parchment-500 text-sm italic">seven keys,<br />one door</span>
        </div>
      </div>

      {/* Editorial list */}
      <ol className="mt-14 space-y-0">
        {principles.map((principle, index) => {
          const tone = accent(principle.accent)
          return (
            <li key={principle.slug} className="border-t hairline last:border-b">
              <Reveal delay={Math.min(index * 0.05, 0.2)} y={24}>
              <Link
                to={`/principles/${principle.slug}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-6 px-1 hover:bg-ink-800/40 transition-colors"
              >
                <span className={tone.text}>
                  <PrincipleSymbol symbol={principle.symbol} size={40} />
                </span>
                <span className="min-w-0">
                  <span className="font-sans text-xs text-parchment-500">{principle.number}</span>
                  <span className="block font-display text-xl text-parchment-100 group-hover:text-gold-200 transition-colors">
                    {principle.name}
                  </span>
                  <span className="editorial-body mt-1 block text-parchment-400">{principle.summary}</span>
                </span>
                <ArrowRight size={16} className="text-parchment-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </Link>
              </Reveal>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
