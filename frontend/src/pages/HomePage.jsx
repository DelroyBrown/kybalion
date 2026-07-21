import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, Feather, Network } from 'lucide-react'

import { useBook } from '../api/library'
import { usePrinciples, useReflectionPrompts } from '../api/principles'
import { useBookmarks, useHighlights, useProgress, useProgressSummary } from '../api/userData'
import { BookEmblem } from '../components/common/BookEmblem'
import { Reveal } from '../components/common/Reveal'
import { Sigil } from '../components/common/Sigil'
import { PrincipleSymbol } from '../components/principles/PrincipleSymbol'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BOOKS, useActiveBook } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { accent } from '../utils/accents'
import { formatDate, toRoman, truncate } from '../utils/format'

function dayOfYear() {
  const now = new Date()
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
}

export function HomePage() {
  useDocumentTitle('Home')
  const { data: book } = useBook()
  const activeBook = useActiveBook()
  const hermetic = activeBook.hasPrinciples
  const { data: principles } = usePrinciples({ enabled: hermetic })
  const { data: prompts } = useReflectionPrompts('daily')
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: serverProgress } = useProgress()
  const { data: summary } = useProgressSummary()
  const { data: highlights } = useHighlights()
  const { data: bookmarks } = useBookmarks()
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  // Rotating features, changing daily.
  const featured = useMemo(() => {
    if (!principles?.length) return null
    return principles[dayOfYear() % principles.length]
  }, [principles])
  const dailyPrompt = useMemo(() => {
    if (!prompts?.length) return null
    return prompts[dayOfYear() % prompts.length]
  }, [prompts])

  const continueReading = useMemo(() => {
    // Ethiopian Bible chapters are seeded with an `eb-` slug prefix.
    const bookFor = (slug) => (slug.startsWith('eb-') ? BOOKS['ethiopian-bible'] : BOOKS['the-kybalion'])
    if (authed && serverProgress?.length) {
      // Ordered by -updated_at: resume the most recently touched unfinished
      // chapter, whichever book it belongs to.
      const current = serverProgress.find((p) => !p.completed) || serverProgress[0]
      if (current) {
        return {
          slug: current.chapter,
          title: current.chapter_title,
          number: current.chapter_number,
          percent: current.percent_complete,
          book: bookFor(current.chapter),
        }
      }
    }
    // Anonymous progress lives locally; titles come from the loaded book's
    // chapter list, so the most recent entry the open book can name wins.
    const local = Object.entries(localProgress).sort(
      (a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0)
    )
    for (const [slug, progress] of local) {
      const chapter = book?.chapters?.find((c) => c.slug === slug)
      if (chapter) {
        return {
          slug,
          title: chapter.title,
          number: chapter.number,
          percent: progress.percent,
          book: bookFor(slug),
        }
      }
    }
    return null
  }, [authed, serverProgress, localProgress, book])

  const recentHighlights = highlights?.results?.slice(0, 3) || []
  const recentBookmarks = bookmarks?.results?.slice(0, 3) || []
  const featuredAccent = accent(featured?.accent)

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 lg:py-16">
      {/* Masthead */}
      <header className="flex items-baseline justify-between border-b hairline pb-6">
        <div>
          <p className="caps-label text-parchment-500">The archive is open</p>
          <h1 className="mt-2 font-display font-light text-3xl sm:text-4xl text-parchment-100">
            {activeBook.title}
          </h1>
        </div>
        <BookEmblem bookSlug={activeBook.slug} size={44} className="text-gold-500 hidden sm:block" />
      </header>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Main column */}
        <div className="lg:col-span-7 space-y-12">
          {/* Continue reading */}
          <Reveal>
          <section aria-labelledby="continue-heading">
            <h2 id="continue-heading" className="caps-label text-gold-400">
              {continueReading ? 'Continue reading' : 'Begin reading'}
            </h2>
            {continueReading ? (
              <Link
                to={`/read/${continueReading.slug}`}
                className="group lift mt-4 block border hairline rounded-sm p-6 hover:border-gold-600/60"
              >
                <p className="font-sans text-xs text-parchment-500">
                  {continueReading.book.chapterLabel}{' '}
                  {continueReading.book.chapterNumerals === 'roman'
                    ? toRoman(continueReading.number)
                    : continueReading.number}
                </p>
                <p className="mt-1.5 font-display text-2xl text-parchment-100 group-hover:text-gold-200 transition-colors">
                  {continueReading.title}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-px flex-1 bg-ink-600 relative overflow-hidden rounded">
                    <div
                      className="absolute inset-y-0 left-0 bg-gold-500"
                      style={{ width: `${Math.min(continueReading.percent, 100)}%` }}
                    />
                  </div>
                  <span className="font-sans text-xs text-parchment-500">
                    {Math.round(continueReading.percent)}%
                  </span>
                  <ArrowRight size={15} className="text-gold-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
              </Link>
            ) : (
              <Link
                to="/read"
                className="group mt-4 block border hairline rounded-sm p-6 hover:border-gold-600/60 transition-colors"
              >
                <p className="font-display text-2xl text-parchment-100 group-hover:text-gold-200 transition-colors">
                  {hermetic ? 'Chapter I — The Hermetic Philosophy' : 'Genesis — In the beginning'}
                </p>
                <p className="editorial-body mt-2 text-parchment-400">
                  {hermetic
                    ? 'Enter the text where the tradition itself begins: with readiness, and with keys.'
                    : 'Open the broadest canon in Christendom at its first words.'}
                </p>
              </Link>
            )}
          </section>
          </Reveal>

          {/* Daily passage */}
          {hermetic && featured && (
            <Reveal delay={0.1}>
            <section aria-labelledby="passage-heading" className="border-l-2 pl-6" style={{ borderColor: featuredAccent.hex }}>
              <h2 id="passage-heading" className="caps-label text-parchment-500">
                Passage of the day
              </h2>
              <blockquote className="mt-4 font-serif text-xl sm:text-2xl leading-relaxed text-parchment-100">
                “{featured.aphorism}”
              </blockquote>
              <p className="mt-3 font-sans text-xs text-parchment-500">
                The Kybalion, ch. II · {featured.name}
              </p>
              <Link
                to={`/principles/${featured.slug}`}
                className="mt-4 inline-flex items-center gap-2 font-sans text-sm text-gold-300 hover:text-gold-200"
              >
                Study this principle <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </section>
            </Reveal>
          )}

          {/* Featured principle */}
          {hermetic && featured && (
            <Reveal delay={0.15}>
            <section aria-labelledby="principle-heading">
              <h2 id="principle-heading" className="caps-label text-gold-400">
                Featured principle
              </h2>
              <Link
                to={`/principles/${featured.slug}`}
                className="group lift mt-4 flex items-start gap-5 border hairline rounded-sm p-6 hover:border-gold-600/60"
              >
                <span className={featuredAccent.text}>
                  <PrincipleSymbol symbol={featured.symbol} size={52} />
                </span>
                <span>
                  <span className="font-sans text-xs text-parchment-500">Principle {featured.number} of 7</span>
                  <span className="block mt-1 font-display text-xl text-parchment-100 group-hover:text-gold-200 transition-colors">
                    {featured.name}
                  </span>
                  <span className="editorial-body mt-2 block">{featured.summary}</span>
                </span>
              </Link>
            </section>
            </Reveal>
          )}
        </div>

        {/* Side column */}
        <aside className="lg:col-span-5 space-y-10 lg:border-l hairline lg:pl-10">
          {/* Journal prompt */}
          <Reveal delay={0.2}>
          <section aria-labelledby="prompt-heading">
            <h2 id="prompt-heading" className="caps-label text-parchment-500 flex items-center gap-2">
              <Feather size={13} aria-hidden="true" /> Today's reflection
            </h2>
            <p className="mt-3 font-serif italic text-lg text-parchment-200 leading-relaxed">
              {dailyPrompt?.prompt || 'Where do you notice this principle operating in daily life?'}
            </p>
            <Link
              to="/journal"
              className="mt-3 inline-flex items-center gap-2 font-sans text-sm text-gold-300 hover:text-gold-200"
            >
              Write in your journal <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
          </Reveal>

          {/* Knowledge map preview (Kybalion) / Daily psalm (Ethiopian Bible) */}
          {hermetic ? (
            <Reveal delay={0.25}>
            <section aria-labelledby="map-heading">
              <h2 id="map-heading" className="caps-label text-parchment-500 flex items-center gap-2">
                <Network size={13} aria-hidden="true" /> Knowledge map
              </h2>
              <Link
                to="/map"
                className="group lift mt-3 flex items-center justify-center border hairline rounded-sm py-8 hover:border-gold-600/60"
              >
                <Sigil size={88} className="text-ink-500 group-hover:text-gold-600 transition-colors" />
                <span className="sr-only">Open the knowledge map</span>
              </Link>
              <p className="editorial-body mt-2 text-parchment-500 text-sm">
                Seven principles, fifteen chapters, and every connection between them.
              </p>
            </section>
            </Reveal>
          ) : (
            <Reveal delay={0.25}>
            <section aria-labelledby="psalm-heading">
              <h2 id="psalm-heading" className="caps-label text-parchment-500 flex items-center gap-2">
                <Network size={13} aria-hidden="true" /> Psalm of the day
              </h2>
              <Link
                to={`/read/eb-psalms#section-s${(dayOfYear() % 150) + 1}`}
                className="group lift mt-3 flex items-center justify-center border hairline rounded-sm py-8 hover:border-gold-600/60"
              >
                <BookEmblem
                  bookSlug="ethiopian-bible"
                  size={88}
                  className="text-ink-500 group-hover:text-gold-600 transition-colors"
                />
                <span className="sr-only">Open today's psalm</span>
              </Link>
              <p className="editorial-body mt-2 text-parchment-500 text-sm">
                Psalm {(dayOfYear() % 150) + 1} — one of the hundred and fifty, in its turn.
              </p>
            </section>
            </Reveal>
          )}

          {/* Saved things */}
          {authed && (
            <Reveal delay={0.1}>
            <section aria-labelledby="saved-heading">
              <h2 id="saved-heading" className="caps-label text-parchment-500 flex items-center gap-2">
                <Bookmark size={13} aria-hidden="true" /> Recently saved
              </h2>
              <ul className="mt-3 space-y-3">
                {recentHighlights.map((highlight) => (
                  <li key={`h-${highlight.id}`}>
                    <Link
                      to={`/read/${highlight.chapter.slug}`}
                      className="block border-l border-gold-600/50 pl-3 hover:border-gold-400"
                    >
                      <span className="font-serif text-sm text-parchment-200 italic">
                        “{truncate(highlight.text, 90)}”
                      </span>
                      <span className="block font-sans text-xs text-parchment-500 mt-1">
                        Highlight · ch. {toRoman(highlight.chapter.number)} · {formatDate(highlight.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
                {recentBookmarks.map((bookmark) => (
                  <li key={`b-${bookmark.id}`}>
                    <Link
                      to={bookmark.chapter_slug ? `/read/${bookmark.chapter_slug}` : '/bookmarks'}
                      className="block border-l border-ink-500 pl-3 hover:border-gold-400"
                    >
                      <span className="font-sans text-sm text-parchment-300">
                        {bookmark.title || bookmark.label || bookmark.object_id}
                      </span>
                      <span className="block font-sans text-xs text-parchment-500 mt-1">
                        Bookmark · {formatDate(bookmark.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
                {recentHighlights.length === 0 && recentBookmarks.length === 0 && (
                  <li className="editorial-body text-parchment-500 text-sm">
                    Highlights and bookmarks you save will gather here.
                  </li>
                )}
              </ul>
            </section>
            </Reveal>
          )}

          {/* Progress */}
          {authed && summary && (
            <Reveal delay={0.1}>
            <section aria-labelledby="progress-heading">
              <h2 id="progress-heading" className="caps-label text-parchment-500">
                Your progress
              </h2>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-4xl text-gold-300">{summary.overall_percent}%</span>
                <span className="font-sans text-xs text-parchment-500">
                  {summary.chapters_completed} of {summary.chapters_total} chapters complete
                </span>
              </div>
              <Link
                to="/progress"
                className="mt-2 inline-flex items-center gap-2 font-sans text-sm text-gold-300 hover:text-gold-200"
              >
                View reading history <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </section>
            </Reveal>
          )}

          {!authed && (
            <Reveal delay={0.1}>
            <section className="border hairline rounded-sm p-5">
              <p className="editorial-body text-parchment-300">
                Reading freely, no account needed. Create one to keep notes, highlights, and your
                journal in sync across devices.
              </p>
              <Link
                to="/register"
                className="mt-3 inline-flex items-center gap-2 font-sans text-sm text-gold-300 hover:text-gold-200"
              >
                Create an account <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </section>
            </Reveal>
          )}
        </aside>
      </div>
    </div>
  )
}
