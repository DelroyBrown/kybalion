import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useBook } from '../api/library'
import { useProgress } from '../api/userData'
import { LoadingVeil } from '../components/common/states'
import { useActiveBook } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'

/**
 * The chapter of THIS book to resume at, or null when none is begun.
 * Server entries arrive ordered most-recent-first; local entries carry
 * their own timestamps. Progress pointing at chapters the book does not
 * hold — another book's, or slugs from a content reshuffle — is skipped:
 * following those kicked the reader into a different book, or onto a
 * chapter that no longer exists at all.
 */
export function pickResumeTarget({ chapters, authed, serverProgress, localProgress }) {
  const known = new Set((chapters || []).map((chapter) => chapter.slug))
  if (authed) {
    const entry = (serverProgress || []).find((p) => known.has(p.chapter))
    if (entry) return entry.chapter
  }
  const [mostRecent] = Object.entries(localProgress || {})
    .filter(([slug]) => known.has(slug))
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
  return mostRecent ? mostRecent[0] : null
}

/** /read → the most recently read chapter of the open book, or its first
 *  chapter. A periodical opened fresh goes to its archive to pick an issue. */
export function ReadRedirect() {
  const navigate = useNavigate()
  const { data: book } = useBook()
  const activeBook = useActiveBook()
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: serverProgress, isLoading: progressLoading } = useProgress()
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  useEffect(() => {
    if (!book || (authed && progressLoading)) return
    let target = pickResumeTarget({
      chapters: book.chapters,
      authed,
      serverProgress,
      localProgress,
    })
    if (!target && activeBook.kind === 'periodical') {
      // Nothing begun yet: the archive is the way into a periodical.
      navigate('/crisis', { replace: true })
      return
    }
    if (!target) target = book.chapters?.[0]?.slug
    if (target) navigate(`/read/${target}`, { replace: true })
  }, [book, activeBook, authed, serverProgress, progressLoading, localProgress, navigate])

  return <LoadingVeil label="Finding your place" />
}
