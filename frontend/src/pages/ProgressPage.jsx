import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

import { useBook } from '../api/library'
import { useProgress, useProgressSummary } from '../api/userData'
import { EmptyState } from '../components/common/states'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { formatDuration, toRoman } from '../utils/format'

export function ProgressPage() {
  useDocumentTitle('Reading Progress')
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: book } = useBook()
  const { data: serverProgress } = useProgress()
  const { data: summary } = useProgressSummary()
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  const progressFor = (slug) => {
    if (authed && serverProgress) {
      const entry = serverProgress.find((p) => p.chapter === slug)
      return entry ? { percent: entry.percent_complete, completed: entry.completed } : { percent: 0, completed: false }
    }
    const local = localProgress[slug]
    return local ? { percent: local.percent, completed: local.completed } : { percent: 0, completed: false }
  }

  const chapters = book?.chapters || []
  const anyProgress =
    chapters.some((chapter) => progressFor(chapter.slug).percent > 0) ||
    (authed && (summary?.chapters_completed || 0) > 0)

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="font-display font-light text-3xl text-parchment-100">Reading Progress</h1>

      {authed && summary && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Overall', value: `${summary.overall_percent}%` },
            { label: 'Chapters', value: `${summary.chapters_completed}/${summary.chapters_total}` },
            { label: 'Time reading', value: formatDuration(summary.total_reading_seconds) },
            { label: 'Sessions', value: summary.session_count },
          ].map((stat) => (
            <div key={stat.label} className="border hairline rounded-sm p-4 text-center">
              <p className="font-display text-2xl text-gold-300">{stat.value}</p>
              <p className="caps-label text-parchment-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {!authed && (
        <p className="editorial-body mt-6 text-parchment-400 border hairline rounded-sm p-4">
          Progress is currently kept on this device only.{' '}
          <Link to="/register" className="text-gold-300 underline decoration-dotted">
            Create an account
          </Link>{' '}
          and it will follow you — your local progress is offered for merging when you do.
        </p>
      )}

      {anyProgress ? (
        <ol className="mt-10 space-y-1">
          {chapters.map((chapter) => {
            const progress = progressFor(chapter.slug)
            return (
              <li key={chapter.slug}>
                <Link
                  to={`/read/${chapter.slug}`}
                  className="group flex items-center gap-4 rounded-sm px-3 py-3 -mx-3 hover:bg-ink-800/50 transition-colors"
                >
                  <span className="font-display text-sm text-parchment-500 w-8 shrink-0">
                    {toRoman(chapter.number)}
                  </span>
                  <span className="font-serif text-[0.9375rem] text-parchment-200 group-hover:text-gold-200 flex-1 min-w-0 truncate">
                    {chapter.title}
                  </span>
                  <span className="hidden sm:block w-40 h-px bg-ink-600 relative overflow-hidden rounded shrink-0">
                    <span
                      className="absolute inset-y-0 left-0 bg-gold-500"
                      style={{ width: `${Math.min(progress.percent, 100)}%` }}
                    />
                  </span>
                  <span className="font-sans text-xs text-parchment-500 w-12 text-right shrink-0">
                    {progress.completed ? (
                      <Check size={14} className="inline text-gold-400" aria-label="Completed" />
                    ) : (
                      `${Math.round(progress.percent)}%`
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      ) : (
        <EmptyState
          title="The first page awaits"
          body="Progress appears here as you read — per chapter, and across the whole book."
          actionLabel="Begin reading"
          actionTo="/read"
        />
      )}
    </div>
  )
}
