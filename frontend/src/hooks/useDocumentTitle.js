import { useEffect } from 'react'

import { useActiveBook } from '../stores/appStore'

export function useDocumentTitle(title) {
  const book = useActiveBook()
  useEffect(() => {
    document.title = title
      ? `${title} — ${book.title} · The Perennial`
      : `${book.title} · The Perennial`
  }, [title, book.title])
}
