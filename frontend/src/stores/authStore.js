import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Authentication state. Tokens are kept in localStorage via zustand-persist:
 * access tokens are short-lived (30 min) and refresh tokens rotate with
 * blacklisting server-side, which bounds the exposure of storage-based JWTs.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      setSession: ({ user, access, refresh }) => set({ user, access, refresh }),
      setTokens: ({ access, refresh }) =>
        set((state) => ({ access, refresh: refresh ?? state.refresh })),
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null, access: null, refresh: null }),
    }),
    { name: 'kybalion-auth' }
  )
)

export const isAuthenticated = () => Boolean(useAuthStore.getState().access)
