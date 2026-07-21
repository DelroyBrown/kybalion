import { useQuery } from '@tanstack/react-query'

import { useAppStore } from '../stores/appStore'
import { api } from './client'

/** The active book (chapters list included), switching with the app store. */
export function useBook() {
  const slug = useAppStore((state) => state.activeBookSlug)
  return useQuery({
    queryKey: ['book', slug],
    queryFn: () => api(`/books/${slug}/`),
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
