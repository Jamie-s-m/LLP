import axios from 'axios'

// Clean and format API URL string safely
const getSanitizedApiUrl = (): string => {
  const defaultApiUrl = import.meta.env.PROD
    ? 'https://api.linguanest.uz/api'
    : 'http://localhost:5000/api'
  let rawUrl = import.meta.env.VITE_API_URL || defaultApiUrl

  // Remove brackets [], quotes '', "", parentheses (), and whitespace
  // eslint-disable-next-line no-useless-escape
  rawUrl = rawUrl.replace(/[\[\]"'()\s]+/g, '').trim()

  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'https://' + rawUrl
  }

  // Remove trailing slashes
  rawUrl = rawUrl.replace(/\/+$/, '')

  // Ensure /api suffix exists
  if (!rawUrl.endsWith('/api')) {
    rawUrl = rawUrl + '/api'
  }

  return rawUrl
}

const api = axios.create({
  baseURL: getSanitizedApiUrl(),
  timeout: 45000, // 45s timeout for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token automatically (safely)
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) {
    config.headers = config.headers || {}
    // Bearer token format
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

// A 401 on an authenticated request means the stored session is no longer valid (expired,
// revoked, or corrupted - see authStore.login()'s guard against storing a malformed payload).
// Without this, a page just shows its own generic "could not save" error while silently
// still rendering as signed-in, with no way out except knowing to manually log out and back
// in. Excludes /auth/* itself - a 401 there is a normal "wrong credentials" response, not an
// expired session, and redirecting would create a loop on the login page.
// A 402 means the gate added in Phase 7 (backend/src/utils/entitlement.js) blocked a real
// content/exercise/flashcard access point because the user's plan isn't active. Dispatching a
// DOM event rather than importing a store/component here keeps this interceptor free of a
// dependency on the rest of the app's module graph - PaywallModal (mounted once in App.tsx)
// just listens for it, wherever the 402 came from.
export const PAYWALL_EVENT = 'linguanest:paywall'

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !String(error.config?.url || '').includes('/auth/') &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login?sessionExpired=1'
    }

    if (
      typeof window !== 'undefined' &&
      error.response?.status === 402 &&
      error.response?.data?.data?.requiresUpgrade
    ) {
      window.dispatchEvent(new CustomEvent(PAYWALL_EVENT, {
        detail: { message: error.response?.data?.message as string | undefined },
      }))
    }

    return Promise.reject(error)
  }
)

export default api
