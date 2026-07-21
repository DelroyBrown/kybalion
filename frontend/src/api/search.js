import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '../stores/authStore'
import { api } from './client'

export function useSearch({ query, types, book, chapter, principle, exact }) {
  return useQuery({
    queryKey: ['search', { query, types, book, chapter, principle, exact }],
    queryFn: () =>
      api('/search/', {
        params: {
          q: query,
          types: types?.length ? types.join(',') : undefined,
          book,
          chapter,
          principle,
          exact: exact ? 'true' : undefined,
        },
      }),
    enabled: Boolean(query && query.trim().length >= 2),
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  })
}

export function useRecentSearches() {
  const authed = useAuthStore((state) => Boolean(state.access))
  return useQuery({
    queryKey: ['recent-searches'],
    queryFn: () => api('/search/recent/'),
    enabled: authed,
  })
}

export function useClearRecentSearches() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api('/search/recent/', { method: 'DELETE' }),
    onSuccess: () => queryClient.setQueryData(['recent-searches'], []),
  })
}
