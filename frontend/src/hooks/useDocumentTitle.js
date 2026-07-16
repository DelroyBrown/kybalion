import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    const base = 'The Kybalion'
    document.title = title ? `${title} — ${base}` : `${base} — An Interactive Study Edition`
  }, [title])
}
