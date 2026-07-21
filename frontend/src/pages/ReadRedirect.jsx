import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useBook } from '../api/library'
import { useProgress } from '../api/userData'
import { LoadingVeil } from '../components/common/states'
import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'

/** /read → the most recently read chapter, or the first chapter. */
export function ReadRedirect() {
  const navigate = useNavigate()
  const { data: book } = useBook()
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: serverProgress, isLoading: progressLoading } = useProgress()
  const localProgress = useLocalProgressStore((state) => state.byChapter)

  useEffect(() => {
    if (!book || (authed && progressLoading)) return
    let target = null
    if (authed && serverProgress?.length) {
      // Ordered by -updated_at: the last place read, in whichever book.
      // The reader syncs the active book to the opened chapter.
      target = serverProgress[0]?.chapter
    }
    if (!target) {
      const entries = Object.entries(localProgress)
      if (entries.length) {
        target = entries.sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))[0][0]
      }
    }
    if (!target) target = book.chapters[0]?.slug
    if (target) navigate(`/read/${target}`, { replace: true })
  }, [book, authed, serverProgress, progressLoading, localProgress, navigate])

  return <LoadingVeil label="Finding your place" />
}
