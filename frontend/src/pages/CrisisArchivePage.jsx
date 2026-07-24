import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

import { useBook } from '../api/library'
import { useProgress } from '../api/userData'
import { BookEmblem } from '../components/common/BookEmblem'
import { LoadingVeil } from '../components/common/states'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { cn } from '../utils/cn'
import { EASE } from '../utils/motion'

// Months abbreviated the way the press did, so twelve fit on a shelf row.
const MONTH_ABBREV = {
  January: 'Jan.', February: 'Feb.', March: 'March', April: 'April', May: 'May',
  June: 'June', July: 'July', August: 'Aug.', September: 'Sept.', October: 'Oct.',
  November: 'Nov.', December: 'Dec.',
}

/** One issue as a miniature front page on the rack. */
function IssueCard({ issue, progress, index }) {
  const [monthFull, year] = issue.title.split(' ')
  const month = MONTH_ABBREV[monthFull] || monthFull
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -4% 0px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.3), ease: EASE }}
    >
      <Link
        to={`/read/${issue.slug}`}
        className={cn(
          'lift group relative flex flex-col border rounded-sm px-3 pt-2.5 pb-3 h-full',
          'bg-ink-900/60 hover:bg-ink-850',
          progress?.completed
            ? 'border-gold-600/50'
            : 'hairline hover:border-gold-600/60'
        )}
      >
        <span className="block text-center font-sans text-[0.5rem] tracking-widecaps uppercase text-parchment-500 border-b hairline pb-1.5">
          The Crisis
        </span>
        <span className="mt-2.5 block text-center font-display text-xl leading-none text-parchment-100 group-hover:text-gold-200 transition-colors">
          {month}
        </span>
        <span className="mt-1 block text-center font-sans text-[0.625rem] text-parchment-500">
          {year} · {issue.subtitle || `No. ${issue.number}`}
        </span>
        <span className="mt-auto pt-2 flex items-center justify-center min-h-5" aria-hidden="true">
          {progress?.completed ? (
            <Check size={12} className="text-gold-400" />
          ) : progress?.percent > 0 ? (
            <span className="h-px w-10 bg-ink-600 relative overflow-hidden rounded">
              <span
                className="absolute inset-y-0 left-0 bg-gold-500"
                style={{ width: `${Math.min(progress.percent, 100)}%` }}
              />
            </span>
          ) : null}
        </span>
        {progress?.completed && <span className="sr-only">Read</span>}
      </Link>
    </motion.div>
  )
}

/**
 * The archive rack of The Crisis: every issue from November 1910 to
 * December 1930, shelved by year — pick any one and read it whole.
 */
export function CrisisArchivePage() {
  useDocumentTitle('The Archive · The Crisis')
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  useEffect(() => setActiveBook('the-crisis'), [setActiveBook])

  const { data: book, isLoading } = useBook()
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: serverProgress } = useProgress()
  const localProgress = useLocalProgressStore((state) => state.byChapter)
  const yearRefs = useRef({})
  const [activeYear, setActiveYear] = useState(null)

  const issues = useMemo(
    () => (book?.slug === 'the-crisis' ? book?.chapters || [] : []),
    [book]
  )

  const years = useMemo(() => {
    const map = new Map()
    for (const issue of issues) {
      const year = issue.slug.split('-')[1]
      if (!map.has(year)) map.set(year, [])
      map.get(year).push(issue)
    }
    return [...map.entries()]
  }, [issues])

  const progressFor = (slug) => {
    if (authed && serverProgress) {
      const entry = serverProgress.find((p) => p.chapter === slug)
      return entry ? { percent: entry.percent_complete, completed: entry.completed } : null
    }
    const local = localProgress[slug]
    return local ? { percent: local.percent, completed: local.completed } : null
  }

  // Resume where the reader last left the archive.
  const continueIssue = useMemo(() => {
    const candidates = authed
      ? (serverProgress || [])
          .filter((p) => p.chapter.startsWith('crisis-') && !p.completed)
          .map((p) => ({ slug: p.chapter, percent: p.percent_complete }))
      : Object.entries(localProgress)
          .filter(([slug, p]) => slug.startsWith('crisis-') && !p.completed)
          .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
          .map(([slug, p]) => ({ slug, percent: p.percent }))
    const found = candidates[0]
    if (!found) return null
    const issue = issues.find((i) => i.slug === found.slug)
    return issue ? { ...issue, percent: found.percent } : null
  }, [authed, serverProgress, localProgress, issues])

  const readCount = issues.filter((issue) => progressFor(issue.slug)?.completed).length

  const scrollToYear = (year) => {
    setActiveYear(year)
    yearRefs.current[year]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isLoading || book?.slug !== 'the-crisis') {
    return <LoadingVeil label="Opening the archive" />
  }

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 lg:py-14">
      {/* The archive's own masthead */}
      <motion.header
        className="text-center border-b-4 pb-8"
        style={{ borderColor: 'rgb(var(--gold-400) / 0.25)', borderBottomStyle: 'double' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <BookEmblem bookSlug="the-crisis" size={60} animated className="mx-auto text-gold-500" />
        <h1 className="crisis-nameplate mt-5 text-[clamp(2.5rem,8vw,4rem)] leading-none text-parchment-100">
          THE CRISIS
        </h1>
        <p className="caps-label mt-3 text-parchment-500">A Record of the Darker Races</p>
        <p className="editorial-body mt-5 max-w-2xl mx-auto text-parchment-400">
          Every issue of Du&nbsp;Bois's Crisis from November 1910 through December 1930 —
          {' '}{issues.length} numbers, shelved by year. Open any one and read it as it ran:
          department by department, editorial by editorial. The text is recovered from
          microfilm scans, so the occasional scar of the press remains.
        </p>
        {readCount > 0 && (
          <p className="mt-4 font-sans text-xs text-parchment-500">
            {readCount} of {issues.length} issues read
          </p>
        )}
      </motion.header>

      {/* Continue reading */}
      {continueIssue && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
        >
          <Link
            to={`/read/${continueIssue.slug}`}
            className="lift group mt-8 flex items-center justify-between gap-4 border hairline rounded-sm px-5 py-4 hover:border-gold-600/60"
          >
            <span>
              <span className="caps-label text-gold-400">Continue reading</span>
              <span className="mt-1 block font-display text-lg text-parchment-100 group-hover:text-gold-200 transition-colors">
                {continueIssue.title} · {continueIssue.subtitle}
              </span>
            </span>
            <span className="flex items-center gap-3 shrink-0">
              <span className="font-sans text-xs text-parchment-500">
                {Math.round(continueIssue.percent)}%
              </span>
              <ArrowRight size={15} className="text-gold-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </span>
          </Link>
        </motion.div>
      )}

      {/* Year rail */}
      <nav
        aria-label="Years"
        className="sticky top-0 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 mt-8 bg-ink-950/90 backdrop-blur-sm border-b hairline overflow-x-auto"
      >
        <div className="flex gap-1.5 min-w-max">
          {years.map(([year]) => (
            <button
              key={year}
              type="button"
              onClick={() => scrollToYear(year)}
              className={cn(
                'px-2.5 py-1 rounded-sm font-sans text-xs transition-colors',
                activeYear === year
                  ? 'bg-gold-500/[0.14] text-gold-200'
                  : 'text-parchment-400 hover:text-parchment-200 hover:bg-ink-800'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </nav>

      {/* The rack, year by year */}
      {years.map(([year, yearIssues]) => (
        <section
          key={year}
          ref={(node) => {
            yearRefs.current[year] = node
          }}
          aria-labelledby={`year-${year}`}
          className="mt-10 scroll-mt-16"
        >
          <div className="flex items-baseline gap-4">
            <h2 id={`year-${year}`} className="font-display text-3xl font-light text-parchment-100">
              {year}
            </h2>
            <span className="h-px flex-1 bg-ink-700" aria-hidden="true" />
            <span className="font-sans text-xs text-parchment-500">
              Vol. {yearIssues[0].subtitle?.match(/\d+/)?.[0] || '—'}
              {yearIssues[yearIssues.length - 1].subtitle?.match(/\d+/)?.[0] !==
                yearIssues[0].subtitle?.match(/\d+/)?.[0] &&
                `–${yearIssues[yearIssues.length - 1].subtitle?.match(/\d+/)?.[0]}`}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2.5">
            {yearIssues.map((issue, index) => (
              <IssueCard
                key={issue.slug}
                issue={issue}
                index={index}
                progress={progressFor(issue.slug)}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="mt-14 border-t hairline pt-6 text-center">
        <p className="font-sans text-xs text-parchment-500 leading-relaxed max-w-xl mx-auto">
          Text recovered by optical character recognition from the Internet Archive's microfilm
          digitisation. All issues shown were published before 1931 and are in the public domain.
          Each issue links to its original page scans.
        </p>
      </footer>
    </div>
  )
}
