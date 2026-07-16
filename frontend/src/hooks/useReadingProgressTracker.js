import { useCallback, useEffect, useRef } from 'react'

import { useSaveProgress, useRecordSession } from '../api/userData'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'

/**
 * Watches paragraphs scroll through the viewport and records reading
 * progress: locally for everyone, to the server for signed-in readers.
 * Also logs a reading session when the reader leaves the chapter.
 */
export function useReadingProgressTracker({ chapterSlug, totalParagraphs }) {
  const furthestRef = useRef(0)
  const lastSeenRef = useRef(0)
  const observerRef = useRef(null)
  const startedAtRef = useRef(Date.now())
  const saveProgress = useSaveProgress()
  const recordSession = useRecordSession()
  const record = useLocalProgressStore((state) => state.record)

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

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const order = Number(entry.target.dataset.globalOrder || 0)
          if (order > 0) {
            lastSeenRef.current = order
            furthestRef.current = Math.max(furthestRef.current, order)
          }
        }
      },
      { threshold: 0.4 }
    )

    const interval = setInterval(flush, 12000)
    const startedAt = startedAtRef.current

    return () => {
      clearInterval(interval)
      flush()
      observerRef.current?.disconnect()
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
  }, [chapterSlug, totalParagraphs])

  const observeParagraph = useCallback((element) => {
    if (element && observerRef.current) observerRef.current.observe(element)
  }, [])

  return { observeParagraph }
}
