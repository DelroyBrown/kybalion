import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  List,
  Maximize2,
  Minimize2,
  Settings2,
} from 'lucide-react'

import { motion } from 'framer-motion'

import { useChapter } from '../api/library'
import { useReflectionPrompts } from '../api/principles'
import { useBookmarks, useHighlights, useProgress, useToggleBookmark } from '../api/userData'
import { AnnotationPanel } from '../components/annotations/AnnotationPanel'
import { IconButton } from '../components/common/Button'
import { Reveal, useRevealAllowed } from '../components/common/Reveal'
import { scrollToY } from '../components/common/SmoothScroll'
import { ErrorState, LoadingVeil } from '../components/common/states'
import { ChapterNavPanel } from '../components/reader/ChapterNavPanel'
import { CrisisMasthead } from '../components/reader/CrisisMasthead'
import { HoverPreview } from '../components/reader/HoverPreview'
import { ParagraphBlock } from '../components/reader/ParagraphBlock'
import { ReaderControls } from '../components/reader/ReaderControls'
import { SelectionToolbar } from '../components/reader/SelectionToolbar'
import { PrincipleSymbol } from '../components/principles/PrincipleSymbol'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useIsDesktop } from '../hooks/useMediaQuery'
import { useReadingProgressTracker } from '../hooks/useReadingProgressTracker'
import { bookForChapterSlug, useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { useReaderStore } from '../stores/readerStore'
import { useUiStore } from '../stores/uiStore'
import { accent } from '../utils/accents'
import { cn } from '../utils/cn'
import { toRoman } from '../utils/format'

const WIDTH_CLASSES = {
  narrow: 'max-w-reader-narrow',
  comfortable: 'max-w-reader',
  wide: 'max-w-reader-wide',
}

// Above this many paragraphs the per-paragraph scroll-in reveal is skipped:
// mounting thousands of animated elements is what made scripture books crawl.
const REVEAL_PARAGRAPH_LIMIT = 250

const EMPTY_HIGHLIGHTS = []

// Height of the sticky header plus breathing room, for restored positions.
const SCROLL_ANCHOR_OFFSET = 88

/**
 * Instantly scroll the window so the element sits just under the header.
 * Corrective passes run on following frames until the position holds: with
 * content-visibility the page's geometry is only estimated until regions
 * actually render, and deep into a long book a single correction still
 * left the target hundreds of pixels off.
 */
function anchorScrollTo(element) {
  if (!element) return false
  const align = () =>
    scrollToY(element.getBoundingClientRect().top + window.scrollY - SCROLL_ANCHOR_OFFSET)
  align()
  let passes = 0
  const settle = () => {
    const drift = Math.abs(element.getBoundingClientRect().top - SCROLL_ANCHOR_OFFSET)
    // The drift never closes at the document's edges, where the target
    // position clamps — the pass cap keeps that from looping forever.
    if (drift > 1 && passes < 8) {
      passes += 1
      align()
      requestAnimationFrame(settle)
    }
  }
  requestAnimationFrame(settle)
  return true
}

function paragraphByOrder(order) {
  return document.querySelector(`[data-global-order="${order}"]`)
}

/**
 * The thin progress line under the header. Updates the bar width directly
 * on the DOM from a rAF-throttled scroll listener so scrolling never
 * re-renders the reading column (thousands of paragraphs in long books).
 */
function ScrollProgressBar({ chapterSlug }) {
  const barRef = useRef(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      const percent = total > 0 ? Math.min(100, (doc.scrollTop / total) * 100) : 0
      if (barRef.current) barRef.current.style.width = `${percent}%`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [chapterSlug])

  return (
    <div className="h-px relative" style={{ background: 'var(--reader-rule)' }} aria-hidden="true">
      <div
        ref={barRef}
        className="absolute inset-y-0 left-0"
        style={{ width: '0%', background: 'var(--reader-accent)' }}
      />
    </div>
  )
}

export function ReaderPage() {
  const { chapterSlug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: chapter, isLoading, isError, error, refetch } = useChapter(chapterSlug)
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  // The open chapter's own book, known synchronously from its slug. The
  // app-store's active book only catches up in an effect below — deriving
  // layout from it rendered a chapter opened from another book with the
  // wrong masthead, numbering, and chapter list until the sync landed.
  const book = bookForChapterSlug(chapterSlug)
  const scripture = book.kind === 'scripture'
  const periodical = book.kind === 'periodical'
  const roman = book.chapterNumerals === 'roman'
  const numeral = (n) => (roman ? toRoman(n) : n)
  useDocumentTitle(
    chapter
      ? periodical
        ? `${chapter.title} · The Crisis`
        : roman
          ? `${toRoman(chapter.number)}. ${chapter.title}`
          : chapter.title
      : 'Read'
  )

  const settings = useReaderStore((state) => state.settings)
  // Individual selectors: ui-store churn (text selection, mobile menu) must
  // not re-render a reading column that can hold thousands of paragraphs.
  const activePassageSlug = useUiStore((state) => state.activePassageSlug)
  const openPassage = useUiStore((state) => state.openPassage)
  const closePassage = useUiStore((state) => state.closePassage)
  const distractionFree = useUiStore((state) => state.distractionFree)
  const toggleDistractionFree = useUiStore((state) => state.toggleDistractionFree)
  const authed = useAuthStore((state) => Boolean(state.access))
  const isDesktop = useIsDesktop()
  const revealAllowed = useRevealAllowed()

  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [hoverPreview, setHoverPreview] = useState(null)
  const textContainerRef = useRef(null)

  const { data: highlightData } = useHighlights(authed ? chapterSlug : undefined)
  const highlightsByParagraph = useMemo(() => {
    const map = new Map()
    for (const highlight of highlightData?.results || []) {
      const list = map.get(highlight.paragraph) || []
      list.push(highlight)
      map.set(highlight.paragraph, list)
    }
    return map
  }, [highlightData])

  const toggleBookmark = useToggleBookmark()
  const { data: chapterBookmarks } = useBookmarks(authed ? { kind: 'chapter' } : undefined)
  const isBookmarked = (chapterBookmarks?.results || []).some((b) => b.object_id === chapterSlug)

  const { data: chapterPrompts } = useReflectionPrompts('chapter')

  // Flatten paragraphs to give each a stable global reading order.
  const orderedParagraphs = useMemo(() => {
    if (!chapter) return []
    const list = []
    for (const section of chapter.sections) {
      for (const paragraph of section.paragraphs) list.push(paragraph)
    }
    return list
  }, [chapter])
  const globalOrderById = useMemo(
    () => new Map(orderedParagraphs.map((paragraph, index) => [paragraph.id, index + 1])),
    [orderedParagraphs]
  )

  const { observeParagraph } = useReadingProgressTracker({
    chapterSlug,
    totalParagraphs: orderedParagraphs.length,
  })

  // Reading modes.
  const mode = settings.mode
  const showMarks = mode !== 'clean'
  // Scripture shows its real verse numbers by default (its own toggle);
  // the Kybalion keeps opt-in margin numbers as before.
  const showNumbers = scripture
    ? settings.showVerseNumbers !== false
    : settings.showParagraphNumbers || mode === 'study'
  const studyMode = mode === 'study'
  const reflectionMode = mode === 'reflection'

  // Keep the app-level book in step with what is actually open, so a
  // chapter resumed across books carries its own labels and atmosphere.
  useEffect(() => {
    if (chapter?.book) setActiveBook(chapter.book)
  }, [chapter?.book, setActiveBook])

  // Deep link: /read/slug?passage=<slug> opens the annotation panel.
  useEffect(() => {
    const passage = searchParams.get('passage')
    if (passage && chapter) {
      openPassage(passage)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, chapter, openPassage, setSearchParams])

  useEffect(() => () => closePassage(), [chapterSlug, closePassage])
  useEffect(() => scrollToY(0), [chapterSlug])
  // Leaving the reader always restores the surrounding interface.
  useEffect(() => () => useUiStore.setState({ distractionFree: false }), [])

  // Restore the reading position: an explicit anchor (#section or ?p=) wins,
  // otherwise signed-in readers resume at their server-saved paragraph and
  // anonymous readers at the locally saved one.
  const { data: serverProgress, isLoading: serverProgressLoading } = useProgress()
  const localChapterProgress = useLocalProgressStore((state) => state.byChapter[chapterSlug])

  // ---- The Crisis reads one department at a time ------------------- //
  // ?s=<slug> opens a section, ?s=all lays out the whole issue. With no
  // parameter, the section holding the saved position (or a ?p target, or
  // simply the first) opens — so resuming always lands in the right place.
  const sectionBounds = useMemo(() => {
    const bounds = new Map()
    if (!chapter) return bounds
    let start = 1
    for (const section of chapter.sections) {
      bounds.set(section.slug, { start, end: start + section.paragraphs.length - 1 })
      start += section.paragraphs.length
    }
    return bounds
  }, [chapter])

  const sectionForOrder = useCallback(
    (order) => {
      for (const [slug, bound] of sectionBounds) {
        if (order >= bound.start && order <= bound.end) return slug
      }
      return null
    },
    [sectionBounds]
  )

  const sectionParam = searchParams.get('s')
  const activeSection = useMemo(() => {
    if (!periodical || !chapter?.sections?.length) return 'all'
    if (sectionParam === 'all') return 'all'
    if (sectionParam && chapter.sections.some((section) => section.slug === sectionParam)) {
      return sectionParam
    }
    const explicit = Number(searchParams.get('p'))
    if (explicit > 0) return sectionForOrder(explicit) || chapter.sections[0].slug
    const server = authed ? (serverProgress || []).find((p) => p.chapter === chapterSlug) : null
    const saved = server ? server.last_paragraph_order : localChapterProgress?.lastParagraphOrder || 0
    if (saved > 1 && saved < orderedParagraphs.length) {
      return sectionForOrder(saved) || chapter.sections[0].slug
    }
    return chapter.sections[0].slug
  }, [
    periodical,
    chapter,
    sectionParam,
    searchParams,
    authed,
    serverProgress,
    chapterSlug,
    localChapterProgress,
    orderedParagraphs.length,
    sectionForOrder,
  ])

  const visibleSections = useMemo(() => {
    if (!chapter) return []
    if (!periodical || activeSection === 'all') return chapter.sections
    return chapter.sections.filter((section) => section.slug === activeSection)
  }, [chapter, periodical, activeSection])

  const openSection = useCallback(
    (slug) => setSearchParams(slug ? { s: slug } : {}),
    [setSearchParams]
  )

  // Moving between sections lands at the top of the new one; the initial
  // mount is the position restore's business, not ours.
  const previousSectionRef = useRef(null)
  useEffect(() => {
    if (previousSectionRef.current && previousSectionRef.current !== activeSection) {
      scrollToY(0)
    }
    previousSectionRef.current = activeSection
  }, [activeSection])

  const sectionIndex = periodical && activeSection !== 'all'
    ? (chapter?.sections || []).findIndex((section) => section.slug === activeSection)
    : -1
  const previousSection = sectionIndex > 0 ? chapter.sections[sectionIndex - 1] : null
  const nextSection =
    sectionIndex >= 0 && sectionIndex < (chapter?.sections?.length || 0) - 1
      ? chapter.sections[sectionIndex + 1]
      : null
  const restoredChapterRef = useRef(null)
  useEffect(() => {
    if (!chapter) return
    if (authed && serverProgressLoading) return
    if (restoredChapterRef.current === chapterSlug) return
    restoredChapterRef.current = chapterSlug

    const hash = window.location.hash
    if (hash && anchorScrollTo(document.getElementById(hash.slice(1)))) return

    const explicit = Number(searchParams.get('p'))
    if (explicit > 0 && anchorScrollTo(paragraphByOrder(explicit))) return

    const server = authed ? (serverProgress || []).find((p) => p.chapter === chapterSlug) : null
    const saved = server ? server.last_paragraph_order : localChapterProgress?.lastParagraphOrder || 0
    const total = orderedParagraphs.length
    // Resume mid-chapter; a chapter read to its end starts again at the top.
    if (saved > 1 && saved < total) anchorScrollTo(paragraphByOrder(saved))
  }, [
    chapter,
    chapterSlug,
    authed,
    serverProgress,
    serverProgressLoading,
    localChapterProgress,
    orderedParagraphs.length,
    searchParams,
  ])

  const visibleParagraphCount = visibleSections.reduce(
    (count, section) => count + section.paragraphs.length,
    0
  )
  const revealParagraphs = revealAllowed && visibleParagraphCount <= REVEAL_PARAGRAPH_LIMIT

  const onPassageHover = useCallback((passage, element) => {
    if (!passage || !element) {
      setHoverPreview(null)
      return
    }
    const rect = element.getBoundingClientRect()
    setHoverPreview({
      passage,
      x: Math.min(rect.left, window.innerWidth - 320),
      y: Math.max(8, rect.top - 76),
    })
  }, [])

  // A periodical also waits for saved progress, so the right section opens.
  if (isLoading || (periodical && authed && serverProgressLoading)) {
    return <LoadingVeil label={periodical ? 'Opening the issue' : 'Opening the chapter'} />
  }
  if (isError) {
    return (
      <ErrorState
        title={error?.status === 404 ? 'This chapter is not in the archive' : 'The chapter could not be opened'}
        error={error}
        onRetry={refetch}
      />
    )
  }
  if (!chapter) return null

  const panelOffset = activePassageSlug && isDesktop ? 'xl:mr-[26rem]' : ''

  return (
    <div
      data-reader-theme={settings.theme}
      data-book-style={periodical ? 'crisis' : undefined}
      className="min-h-dvh transition-colors duration-300"
    >
      {/* Sticky, quiet header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-sm border-b"
        style={{ background: 'color-mix(in srgb, var(--reader-bg) 88%, transparent)', borderColor: 'var(--reader-rule)' }}
      >
        <div className={cn('mx-auto flex items-center gap-1 px-3 sm:px-6 h-14 transition-[margin]', panelOffset)}>
          <IconButton label="Chapter list" onClick={() => setChaptersOpen(true)}>
            <List size={17} />
          </IconButton>
          <div className="min-w-0 flex-1 px-2">
            <p className="caps-label truncate" style={{ color: 'var(--reader-muted)' }}>
              {book.chapterLabel} {numeral(chapter.number)} · {chapter.title}
            </p>
          </div>
          <IconButton
            label={isBookmarked ? 'Remove chapter bookmark' : 'Bookmark this chapter'}
            active={isBookmarked}
            onClick={() => {
              if (!authed) {
                navigate('/login')
                return
              }
              toggleBookmark.mutate({
                kind: 'chapter',
                object_id: chapter.slug,
                chapter_slug: chapter.slug,
                title: chapter.title,
                label: `${book.chapterLabel} ${numeral(chapter.number)}`,
              })
            }}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </IconButton>
          <IconButton label="Reading settings" onClick={() => setControlsOpen(true)}>
            <Settings2 size={16} />
          </IconButton>
          <IconButton
            label={distractionFree ? 'Exit distraction-free mode' : 'Distraction-free mode'}
            onClick={toggleDistractionFree}
          >
            {distractionFree ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconButton>
        </div>
        {/* The issue's departments, always one tap away. */}
        {periodical && chapter.sections.length > 1 && (
          <nav
            aria-label="Sections of this issue"
            className="overflow-x-auto border-t"
            style={{ borderColor: 'var(--reader-rule)' }}
          >
            <div className={cn('mx-auto flex items-center gap-1 px-3 sm:px-6 h-9 w-max min-w-full transition-[margin]', panelOffset)}>
              {chapter.sections.map((section) => (
                <button
                  key={section.slug}
                  type="button"
                  onClick={() => openSection(section.slug)}
                  aria-current={activeSection === section.slug ? 'true' : undefined}
                  className="shrink-0 max-w-[13rem] truncate px-2.5 py-1 rounded-sm font-sans text-[0.6875rem] tracking-caps uppercase transition-colors"
                  style={{
                    color:
                      activeSection === section.slug ? 'var(--reader-accent)' : 'var(--reader-muted)',
                    background:
                      activeSection === section.slug
                        ? 'color-mix(in srgb, var(--reader-accent) 12%, transparent)'
                        : 'transparent',
                  }}
                >
                  {section.title}
                </button>
              ))}
              <span
                aria-hidden="true"
                className="shrink-0 h-4 w-px mx-1"
                style={{ background: 'var(--reader-rule)' }}
              />
              <button
                type="button"
                onClick={() => openSection('all')}
                aria-current={activeSection === 'all' ? 'true' : undefined}
                className="shrink-0 px-2.5 py-1 rounded-sm font-sans text-[0.6875rem] tracking-caps uppercase transition-colors"
                style={{
                  color: activeSection === 'all' ? 'var(--reader-accent)' : 'var(--reader-muted)',
                  background:
                    activeSection === 'all'
                      ? 'color-mix(in srgb, var(--reader-accent) 12%, transparent)'
                      : 'transparent',
                }}
              >
                Entire issue
              </button>
            </div>
          </nav>
        )}
        <ScrollProgressBar chapterSlug={chapterSlug} />
      </header>

      {/* Reading column */}
      <div
        className={cn('mx-auto px-5 sm:px-10 transition-[margin]', WIDTH_CLASSES[settings.width], panelOffset && 'xl:mx-auto', panelOffset)}
        style={{
          '--reader-font-scale': settings.fontScale,
          '--reader-line-height': settings.lineHeight,
        }}
      >
        {periodical ? (
          <CrisisMasthead
            chapter={chapter}
            activeSection={activeSection}
            onSelectSection={openSection}
          />
        ) : (
        <motion.header
          className="pt-14 pb-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.p
            className="caps-label"
            style={{ color: 'var(--reader-muted)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            {book.chapterLabel} {numeral(chapter.number)}
          </motion.p>
          <motion.h1
            className="mt-3 font-display font-light text-3xl sm:text-4xl"
            style={{ color: 'var(--reader-ink)' }}
            initial={{ opacity: 0, y: 12, letterSpacing: '0.06em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0em' }}
            transition={{ delay: 0.25, duration: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {chapter.title}
          </motion.h1>
          {chapter.subtitle && (
            <p className="mt-2 font-serif italic" style={{ color: 'var(--reader-muted)' }}>
              {chapter.subtitle}
            </p>
          )}
          {chapter.introduction && mode !== 'clean' && (
            <div
              className="mt-8 text-left border rounded-sm p-5"
              style={{ borderColor: 'var(--reader-rule)' }}
            >
              <span className="caps-label block mb-2" style={{ color: 'var(--reader-muted)' }}>
                Editorial introduction
              </span>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--reader-muted)' }}>
                {chapter.introduction}
              </p>
            </div>
          )}
        </motion.header>
        )}

        <div ref={textContainerRef} className="reader-text pb-6">
          {visibleSections.map((section) => {
            const firstBodyId = periodical
              ? section.paragraphs.find((paragraph) => paragraph.kind === 'body')?.id
              : undefined
            return (
            <section key={section.id} className={periodical ? 'mb-14' : 'mb-12'}>
              {section.title && (
                <h2
                  className="caps-label text-center mb-8"
                  style={{ color: periodical ? 'var(--reader-ink)' : 'var(--reader-muted)' }}
                  id={`section-${section.slug}`}
                >
                  {section.title}
                </h2>
              )}
              <div className="space-y-6">
                {section.paragraphs.map((paragraph) => (
                  <ParagraphBlock
                    key={paragraph.id}
                    ref={observeParagraph}
                    paragraph={paragraph}
                    globalOrder={globalOrderById.get(paragraph.id)}
                    displayNumber={scripture ? paragraph.order || null : undefined}
                    showMarks={showMarks}
                    showNumbers={showNumbers}
                    inlineNumbers={scripture}
                    newspaper={periodical}
                    dropCap={paragraph.id === firstBodyId}
                    reveal={revealParagraphs}
                    highlights={highlightsByParagraph.get(paragraph.id) || EMPTY_HIGHLIGHTS}
                    activePassageSlug={activePassageSlug}
                    onOpenPassage={openPassage}
                    onPassageHover={onPassageHover}
                  />
                ))}
              </div>
            </section>
            )
          })}
        </div>

        {/* End of chapter */}
        <footer className="pb-24">
          <Reveal>
          {chapter.summary && mode !== 'clean' && (
            <div className="border rounded-sm p-5" style={{ borderColor: 'var(--reader-rule)' }}>
              <span className="caps-label block mb-2" style={{ color: 'var(--reader-muted)' }}>
                Editorial summary
              </span>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--reader-muted)' }}>
                {chapter.summary}
              </p>
            </div>
          )}

          {chapter.principles?.length > 0 && (
            <div className="mt-8">
              <span className="caps-label block mb-3" style={{ color: 'var(--reader-muted)' }}>
                Principles in this chapter
              </span>
              <div className="flex flex-wrap gap-2">
                {chapter.principles.map((principle) => (
                  <Link
                    key={principle.slug}
                    to={`/principles/${principle.slug}`}
                    className="inline-flex items-center gap-2 border rounded-sm px-3 py-2 font-sans text-xs transition-colors hover:opacity-80"
                    style={{ borderColor: 'var(--reader-rule)', color: 'var(--reader-ink)' }}
                  >
                    <span style={{ color: accent(principle.accent).hex }}>
                      <PrincipleSymbol symbol={principle.symbol} size={16} />
                    </span>
                    {principle.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {reflectionMode && chapterPrompts?.length > 0 && (
            <div className="mt-10 text-center border-t pt-10" style={{ borderColor: 'var(--reader-rule)' }}>
              <span className="caps-label" style={{ color: 'var(--reader-muted)' }}>
                Before you go
              </span>
              <p className="mt-4 font-serif italic text-xl leading-relaxed" style={{ color: 'var(--reader-ink)' }}>
                {chapterPrompts[chapter.number % chapterPrompts.length].prompt}
              </p>
              <Link
                to={`/journal?kind=chapter&chapter=${chapter.slug}`}
                className="mt-4 inline-block font-sans text-sm underline decoration-dotted underline-offset-4"
                style={{ color: 'var(--reader-accent)' }}
              >
                Write a reflection
              </Link>
            </div>
          )}

          <nav
            className="mt-12 flex items-stretch justify-between gap-4 border-t pt-8"
            style={{ borderColor: 'var(--reader-rule)' }}
            aria-label={periodical ? 'Section navigation' : 'Chapter navigation'}
          >
            {/* Reading section by section walks the departments first and
                crosses into the neighbouring issue at either end. */}
            {previousSection ? (
              <button
                type="button"
                onClick={() => openSection(previousSection.slug)}
                className="group flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <span className="caps-label flex items-center gap-1.5" style={{ color: 'var(--reader-muted)' }}>
                  <ArrowLeft size={12} aria-hidden="true" /> Previous section
                </span>
                <span className="mt-1 block font-serif text-[0.9375rem]" style={{ color: 'var(--reader-ink)' }}>
                  {previousSection.title}
                </span>
              </button>
            ) : chapter.previous_chapter ? (
              <Link
                to={`/read/${chapter.previous_chapter.slug}`}
                className="group flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <span className="caps-label flex items-center gap-1.5" style={{ color: 'var(--reader-muted)' }}>
                  <ArrowLeft size={12} aria-hidden="true" /> {periodical ? 'Previous issue' : 'Previous'}
                </span>
                <span className="mt-1 block font-serif text-[0.9375rem]" style={{ color: 'var(--reader-ink)' }}>
                  {chapter.previous_chapter.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextSection ? (
              <button
                type="button"
                onClick={() => openSection(nextSection.slug)}
                className="group flex-1 text-right hover:opacity-80 transition-opacity"
              >
                <span className="caps-label flex items-center justify-end gap-1.5" style={{ color: 'var(--reader-muted)' }}>
                  Next section <ArrowRight size={12} aria-hidden="true" />
                </span>
                <span className="mt-1 block font-serif text-[0.9375rem]" style={{ color: 'var(--reader-ink)' }}>
                  {nextSection.title}
                </span>
              </button>
            ) : chapter.next_chapter ? (
              <Link
                to={`/read/${chapter.next_chapter.slug}`}
                className="group flex-1 text-right hover:opacity-80 transition-opacity"
              >
                <span className="caps-label flex items-center justify-end gap-1.5" style={{ color: 'var(--reader-muted)' }}>
                  {periodical ? 'Next issue' : 'Next'} <ArrowRight size={12} aria-hidden="true" />
                </span>
                <span className="mt-1 block font-serif text-[0.9375rem]" style={{ color: 'var(--reader-ink)' }}>
                  {chapter.next_chapter.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
          </Reveal>
        </footer>
      </div>

      <ChapterNavPanel open={chaptersOpen} onClose={() => setChaptersOpen(false)} currentSlug={chapterSlug} />
      <ReaderControls open={controlsOpen} onClose={() => setControlsOpen(false)} />
      <AnnotationPanel passageSlug={activePassageSlug} onClose={closePassage} studyMode={studyMode} />
      <SelectionToolbar containerRef={textContainerRef} />
      <HoverPreview preview={hoverPreview} />
    </div>
  )
}
