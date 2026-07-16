import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '../stores/authStore'
import { useLocalProgressStore } from '../stores/localProgressStore'
import { api } from './client'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, password }) =>
      api('/auth/token/', { method: 'POST', body: { username, password } }),
    onSuccess: async (data, variables) => {
      setSession({ user: { username: variables.username }, access: data.access, refresh: data.refresh })
      const profile = await api('/me/')
      useAuthStore.getState().setUser(profile)
      queryClient.invalidateQueries()
    },
  })
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('/auth/register/', { method: 'POST', body: payload }),
    onSuccess: (data) => {
      setSession({ user: data.user, access: data.access, refresh: data.refresh })
      queryClient.invalidateQueries()
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { refresh } = useAuthStore.getState()
      if (refresh) {
        await api('/auth/logout/', { method: 'POST', body: { refresh } }).catch(() => null)
      }
    },
    onSettled: () => {
      useAuthStore.getState().clearSession()
      queryClient.clear()
    },
  })
}

export function useProfile() {
  const authed = useAuthStore((state) => Boolean(state.access))
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api('/me/'),
    enabled: authed,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch) => api('/me/', { method: 'PATCH', body: patch }),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
      useAuthStore.getState().setUser(data)
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api('/me/', { method: 'DELETE' }),
    onSuccess: () => {
      useAuthStore.getState().clearSession()
      queryClient.clear()
    },
  })
}

export function useExportData() {
  return useMutation({
    mutationFn: () => api('/me/export/'),
    onSuccess: (data) => downloadJson(data, 'kybalion-export.json'),
  })
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Offer local anonymous progress to the server after login/registration. */
export function useMergeLocalProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      const entries = useLocalProgressStore.getState().toMergeEntries()
      if (entries.length === 0) return Promise.resolve({ merged: 0 })
      return api('/me/progress/merge/', { method: 'POST', body: { entries } })
    },
    onSuccess: (data) => {
      if (data.merged > 0) useLocalProgressStore.getState().clear()
      queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}
