import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '../stores/authStore'
import { api } from './client'

function useAuthed() {
  return useAuthStore((state) => Boolean(state.access))
}

/* ----------------------------- Bookmarks ------------------------------ */

export function useBookmarks(params) {
  const authed = useAuthed()
  return useQuery({
    queryKey: ['bookmarks', params ?? {}],
    queryFn: () => api('/me/bookmarks/', { params: { page_size: 100, ...params } }),
    enabled: authed,
  })
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('/me/bookmarks/toggle/', { method: 'POST', body: payload }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => api(`/me/bookmarks/${id}/`, { method: 'PATCH', body: patch }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api(`/me/bookmarks/${id}/`, { method: 'DELETE' }),
    onMutate: async (id) => {
      // Optimistic removal from every bookmark list in the cache.
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })
      const snapshots = queryClient.getQueriesData({ queryKey: ['bookmarks'] })
      snapshots.forEach(([key, data]) => {
        if (data?.results) {
          queryClient.setQueryData(key, {
            ...data,
            count: data.count - 1,
            results: data.results.filter((b) => b.id !== id),
          })
        }
      })
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      context?.snapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}

/* ----------------------------- Highlights ----------------------------- */

export function useHighlights(chapterSlug) {
  const authed = useAuthed()
  const params = { page_size: 100 }
  if (chapterSlug) params['paragraph__section__chapter__slug'] = chapterSlug
  return useQuery({
    queryKey: ['highlights', chapterSlug ?? 'all'],
    queryFn: () => api('/me/highlights/', { params }),
    enabled: authed,
  })
}

export function useCreateHighlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('/me/highlights/', { method: 'POST', body: payload }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['highlights'] }),
  })
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => api(`/me/highlights/${id}/`, { method: 'PATCH', body: patch }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['highlights'] }),
  })
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api(`/me/highlights/${id}/`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['highlights'] }),
  })
}

/* ------------------------------- Notes -------------------------------- */

export function useNotes(params) {
  const authed = useAuthed()
  return useQuery({
    queryKey: ['notes', params ?? {}],
    queryFn: () => api('/me/notes/', { params: { page_size: 100, ...params } }),
    enabled: authed,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('/me/notes/', { method: 'POST', body: payload }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => api(`/me/notes/${id}/`, { method: 'PATCH', body: patch }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api(`/me/notes/${id}/`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })
}

/* ------------------------------ Journal ------------------------------- */

export function useJournalEntries(params) {
  const authed = useAuthed()
  return useQuery({
    queryKey: ['journal', params ?? {}],
    queryFn: () => api('/me/journal/', { params: { page_size: 100, ...params } }),
    enabled: authed,
  })
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('/me/journal/', { method: 'POST', body: payload }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['journal'] }),
  })
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => api(`/me/journal/${id}/`, { method: 'PATCH', body: patch }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['journal'] }),
  })
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api(`/me/journal/${id}/`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['journal'] }),
  })
}

export function useExportJournal() {
  return useMutation({
    mutationFn: () => api('/me/journal/export/'),
  })
}

/* ------------------------------ Progress ------------------------------ */

export function useProgress() {
  const authed = useAuthed()
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => api('/me/progress/'),
    enabled: authed,
  })
}

export function useProgressSummary() {
  const authed = useAuthed()
  return useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api('/me/progress/summary/'),
    enabled: authed,
  })
}

export function useSaveProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('/me/progress/', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })
}

export function useRecordSession() {
  return useMutation({
    mutationFn: (payload) => api('/me/progress/sessions/', { method: 'POST', body: payload }),
  })
}

/* ---------------------------- Preferences ----------------------------- */

export function useServerPreferences() {
  const authed = useAuthed()
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => api('/me/preferences/'),
    enabled: authed,
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings) => api('/me/preferences/', { method: 'PUT', body: { settings } }),
    onSuccess: (data) => queryClient.setQueryData(['preferences'], data),
  })
}
