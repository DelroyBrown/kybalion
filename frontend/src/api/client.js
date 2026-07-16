import { useAuthStore } from '../stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(status, code, detail) {
    super(typeof detail === 'string' ? detail : code || `Request failed (${status})`)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

let refreshPromise = null

async function refreshAccessToken() {
  // Single-flight: concurrent 401s share one refresh request.
  if (!refreshPromise) {
    const { refresh } = useAuthStore.getState()
    refreshPromise = fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (response) => {
        if (!response.ok) throw new ApiError(response.status, 'refresh_failed', 'Session expired')
        const data = await response.json()
        useAuthStore.getState().setTokens({ access: data.access, refresh: data.refresh })
        return data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

async function execute(path, { method = 'GET', body, params, accessToken } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = data?.error || {}
    throw new ApiError(response.status, error.code, error.detail ?? data)
  }
  return data
}

/**
 * API request with automatic access-token attachment and one transparent
 * refresh-and-retry when the access token has expired.
 */
export async function api(path, options = {}) {
  const { access, refresh } = useAuthStore.getState()
  try {
    return await execute(path, { ...options, accessToken: access })
  } catch (error) {
    const expired = error instanceof ApiError && error.status === 401 && access && refresh
    if (!expired) throw error
    try {
      const newAccess = await refreshAccessToken()
      return await execute(path, { ...options, accessToken: newAccess })
    } catch (refreshError) {
      useAuthStore.getState().clearSession()
      throw refreshError
    }
  }
}
