import { useQuery } from '@tanstack/react-query'

import { api } from './client'

const BOOK_SLUG = 'the-kybalion'

export function useBook() {
  return useQuery({
    queryKey: ['book'],
    queryFn: () => api(`/books/${BOOK_SLUG}/`),
    staleTime: 10 * 60 * 1000,
  })
}

export function useChapter(slug) {
  return useQuery({
    queryKey: ['chapter', slug],
    queryFn: () => api(`/chapters/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  })
}

export function usePassage(slug) {
  return useQuery({
    queryKey: ['passage', slug],
    queryFn: () => api(`/passages/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  })
}
