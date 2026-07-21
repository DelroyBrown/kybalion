import { useCallback, useEffect, useRef, useState } from 'react'

import { useSaveProgress, useRecordSession } from '../api/userData'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'

/**
 * Watches paragraphs scroll through the viewport and records reading
 * progress: locally for everyone, to the server for signed-in readers.
 * Progress is flushed on an interval, when the tab is hidden or closed
 * (with keepalive so the request survives navigation), and on unmount.
 * Also logs a reading session when the reader leaves the chapter.
 */
export function useReadingProgressTracker({ chapterSlug, totalParagraphs }) {
  const furthestRef = useRef(0)
  const lastSeenRef = useRef(0)
  const startedAtRef = useRef(Date.now())
  const observedRef = useRef(new Set())
  const saveProgress = useSaveProgress()
  const recordSession = useRecordSession()
  const record = useLocalProgressStore((state) => state.record)

  // The observer must exist before the first paragraph ref attaches: React
  // calls ref callbacks BEFORE effects run, so an effect-created observer
  // silently observes nothing in production builds. (Dev StrictMode
  // re-attaches refs after effects, which masked exactly that.)
  const [observer] = useState(() =>
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              // Entries can arrive late for paragraphs of a chapter the
              // reader just navigated away from — never count those.
              if (!entry.isIntersecting || !entry.target.isConnected) continue
              const order = Number(entry.target.dataset.globalOrder || 0)
              if (order > 0) {
                lastSeenRef.current = order
                furthestRef.current = Math.max(furthestRef.current, order)
              }
            }
          },
          { threshold: 0.4 }
        )
  )

  const flush = useCallback(() => {
    if (!chapterSlug || furthestRef.current === 0 || !totalParagraphs) return
    const percent = Math.min(100, Math.round((furthestRef.current / totalParagraphs) * 1000) / 10)
    const completed = furthestRef.current >= totalParagraphs
    record(chapterSlug, {
      lastParagraphOrder: lastSeenRef.current,
      furthestParagraphOrder: furthestRef.current,
      percent,
      completed,
    })
    if (useAuthStore.getState().access) {
      saveProgress.mutate({
        chapter: chapterSlug,
        last_paragraph_order: lastSeenRef.current,
        furthest_paragraph_order: furthestRef.current,
        percent_complete: percent,
        completed,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSlug, totalParagraphs, record])

  useEffect(() => {
    furthestRef.current = 0
    lastSeenRef.current = 0
    startedAtRef.current = Date.now()

    const interval = setInterval(flush, 12000)
    const startedAt = startedAtRef.current

    // Closing the tab or switching apps never runs React cleanup, so the
    // exact position is saved the moment the page goes out of view.
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)

    return () => {
      clearInterval(interval)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      flush()
      // Release paragraphs that left the DOM with the previous chapter.
      // The next chapter's paragraphs are already connected and observed —
      // the shared observer itself lives on until the reader unmounts.
      for (const element of observedRef.current) {
        if (!element.isConnected) {
          observer?.unobserve(element)
          observedRef.current.delete(element)
        }
      }
      const durationSeconds = Math.round((Date.now() - startedAt) / 1000)
      if (durationSeconds > 20 && useAuthStore.getState().access && chapterSlug) {
        recordSession.mutate({
          chapter: chapterSlug,
          started_at: new Date(startedAt).toISOString(),
          duration_seconds: durationSeconds,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSlug, totalParagraphs, flush])

  // Full teardown only when the reader itself unmounts.
  useEffect(() => () => observer?.disconnect(), [observer])

  const observeParagraph = useCallback(
    (element) => {
      if (element && observer) {
        observer.observe(element)
        observedRef.current.add(element)
      }
    },
    [observer]
  )

  return { observeParagraph }
}
