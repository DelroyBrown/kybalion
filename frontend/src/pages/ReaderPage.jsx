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
import { ErrorState, LoadingVeil } from '../components/common/states'
import { ChapterNavPanel } from '../components/reader/ChapterNavPanel'
import { HoverPreview } from '../components/reader/HoverPreview'
import { ParagraphBlock } from '../components/reader/ParagraphBlock'
import { ReaderControls } from '../components/reader/ReaderControls'
import { SelectionToolbar } from '../components/reader/SelectionToolbar'
import { PrincipleSymbol } from '../components/principles/PrincipleSymbol'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useIsDesktop } from '../hooks/useMediaQuery'
import { useReadingProgressTracker } from '../hooks/useReadingProgressTracker'
import { useActiveBook, useAppStore } from '../stores/appStore'
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
 * Runs a second corrective pass on the next frame: with content-visibility
 * the geometry settles only once the target region has actually rendered.
 */
function anchorScrollTo(element) {
  if (!element) return false
  element.scrollIntoView()
  requestAnimationFrame(() => {
    const top = element.getBoundingClientRect().top + window.scrollY - SCROLL_ANCHOR_OFFSET
    window.scrollTo(0, Math.max(0, top))
  })
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
  const activeBook = useActiveBook()
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  const scripture = activeBook.chapterNumerals !== 'roman'
  const numeral = (n) => (scripture ? n : toRoman(n))
  useDocumentTitle(chapter ? (scripture ? chapter.title : `${toRoman(chapter.number)}. ${chapter.title}`) : 'Read')

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
  const revealParagraphs = revealAllowed && orderedParagraphs.length <= REVEAL_PARAGRAPH_LIMIT

  const { observeParagraph } = useReadingProgressTracker({
    chapterSlug,
    totalParagraphs: orderedParagraphs.length,
  })

  // Reading modes.
  const mode = settings.mode
  const showMarks = mode !== 'clean'
  const showNumbers = settings.showParagraphNumbers || mode === 'study'
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
  useEffect(() => window.scrollTo({ top: 0 }), [chapterSlug])
  // Leaving the reader always restores the surrounding interface.
  useEffect(() => () => useUiStore.setState({ distractionFree: false }), [])

  // Restore the reading position: an explicit anchor (#section or ?p=) wins,
  // otherwise signed-in readers resume at their server-saved paragraph and
  // anonymous readers at the locally saved one.
  const { data: serverProgress, isLoading: serverProgressLoading } = useProgress()
  const localChapterProgress = useLocalProgressStore((state) => state.byChapter[chapterSlug])
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

  if (isLoading) return <LoadingVeil label="Opening the chapter" />
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
    <div data-reader-theme={settings.theme} className="min-h-dvh transition-colors duration-300">
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
              {activeBook.chapterLabel} {numeral(chapter.number)} · {chapter.title}
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
                label: `${activeBook.chapterLabel} ${numeral(chapter.number)}`,
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
            {activeBook.chapterLabel} {numeral(chapter.number)}
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

        <div ref={textContainerRef} className="reader-text pb-6">
          {chapter.sections.map((section) => (
            <section key={section.id} className="mb-12">
              {section.title && (
                <h2
                  className="caps-label text-center mb-8"
                  style={{ color: 'var(--reader-muted)' }}
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
                    reveal={revealParagraphs}
                    highlights={highlightsByParagraph.get(paragraph.id) || EMPTY_HIGHLIGHTS}
                    activePassageSlug={activePassageSlug}
                    onOpenPassage={openPassage}
                    onPassageHover={onPassageHover}
                  />
                ))}
              </div>
            </section>
          ))}
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
            aria-label="Chapter navigation"
          >
            {chapter.previous_chapter ? (
              <Link
                to={`/read/${chapter.previous_chapter.slug}`}
                className="group flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <span className="caps-label flex items-center gap-1.5" style={{ color: 'var(--reader-muted)' }}>
                  <ArrowLeft size={12} aria-hidden="true" /> Previous
                </span>
                <span className="mt-1 block font-serif text-[0.9375rem]" style={{ color: 'var(--reader-ink)' }}>
                  {chapter.previous_chapter.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {chapter.next_chapter ? (
              <Link
                to={`/read/${chapter.next_chapter.slug}`}
                className="group flex-1 text-right hover:opacity-80 transition-opacity"
              >
                <span className="caps-label flex items-center justify-end gap-1.5" style={{ color: 'var(--reader-muted)' }}>
                  Next <ArrowRight size={12} aria-hidden="true" />
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
