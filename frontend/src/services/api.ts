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

export default api
