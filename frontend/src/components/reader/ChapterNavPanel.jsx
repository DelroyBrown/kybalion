import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'

import { useBook } from '../../api/library'
import { useProgress } from '../../api/userData'
import { useAuthStore } from '../../stores/authStore'
import { useLocalProgressStore } from '../../stores/localProgressStore'
import { cn } from '../../utils/cn'
import { toRoman } from '../../utils/format'
import { IconButton } from '../common/Button'

/** Slide-over chapter list with per-chapter completion state. */
export function ChapterNavPanel({ open, onClose, currentSlug }) {
  const { data: book } = useBook()
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: serverProgress } = useProgress()
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  const progressFor = (slug) => {
    if (authed && serverProgress) {
      const entry = serverProgress.find((p) => p.chapter === slug)
      return entry ? { percent: entry.percent_complete, completed: entry.completed } : null
    }
    const local = localProgress[slug]
    return local ? { percent: local.percent, completed: local.completed } : null
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink-950/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.nav
            aria-label="Chapters"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            data-lenis-prevent
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-ink-900 border-r hairline overflow-y-auto"
            onKeyDown={(event) => event.key === 'Escape' && onClose()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b hairline sticky top-0 bg-ink-900">
              <h2 className="caps-label text-gold-300">Chapters</h2>
              <IconButton label="Close chapter list" onClick={onClose}>
                <X size={16} />
              </IconButton>
            </div>
            <ol className="py-2">
              {(book?.chapters || []).map((chapter) => {
                const progress = progressFor(chapter.slug)
                const isCurrent = chapter.slug === currentSlug
                return (
                  <li key={chapter.slug}>
                    <Link
                      to={`/read/${chapter.slug}`}
                      onClick={onClose}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={cn(
                        'flex items-baseline gap-3 px-5 py-3 transition-colors',
                        isCurrent
                          ? 'bg-gold-500/[0.08] text-gold-200'
                          : 'text-parchment-300 hover:bg-ink-700/50'
                      )}
                    >
                      <span className="font-display text-sm w-8 shrink-0 text-parchment-500">
                        {toRoman(chapter.number)}
                      </span>
                      <span className="font-serif text-[0.9375rem] leading-snug flex-1">{chapter.title}</span>
                      {progress?.completed ? (
                        <Check size={13} className="text-gold-400 shrink-0" aria-label="Completed" />
                      ) : progress?.percent > 0 ? (
                        <span className="font-sans text-[0.6875rem] text-parchment-500 shrink-0">
                          {Math.round(progress.percent)}%
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ol>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  )
}
