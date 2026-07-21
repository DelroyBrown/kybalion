import { useEffect } from 'react'

import { useActiveBook } from '../stores/appStore'

export function useDocumentTitle(title) {
  const book = useActiveBook()
  useEffect(() => {
    const base = book.title
    document.title = title ? `${title} — ${base}` : `${base} — An Interactive Study Edition`
  }, [title, book.title])
}
