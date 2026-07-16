import { useQuery } from '@tanstack/react-query'

import { api } from './client'

export function usePrinciples() {
  return useQuery({
    queryKey: ['principles'],
    queryFn: () => api('/principles/'),
    staleTime: 10 * 60 * 1000,
  })
}

export function usePrinciple(slug) {
  return useQuery({
    queryKey: ['principle', slug],
    queryFn: () => api(`/principles/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  })
}

export function useKnowledgeGraph() {
  return useQuery({
    queryKey: ['knowledge-graph'],
    queryFn: () => api('/principles/graph/'),
    staleTime: 10 * 60 * 1000,
  })
}

export function useReflectionPrompts(context) {
  return useQuery({
    queryKey: ['reflection-prompts', context ?? 'all'],
    queryFn: () => api('/principles/prompts/', { params: context ? { context } : undefined }),
    staleTime: 10 * 60 * 1000,
  })
}
