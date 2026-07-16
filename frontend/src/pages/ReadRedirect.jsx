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
      target = serverProgress[0].chapter // ordered by -updated_at
    } else {
      const entries = Object.keys(localProgress)
      if (entries.length > 0) target = entries[0]
    }
    if (!target) target = book.chapters[0]?.slug
    if (target) navigate(`/read/${target}`, { replace: true })
  }, [book, authed, serverProgress, progressLoading, localProgress, navigate])

  return <LoadingVeil label="Finding your place" />
}
