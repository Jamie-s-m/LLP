import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeTheme } from './store/themeStore'

// Register PWA service worker in production for offline support and update handling.
// registerType: 'autoUpdate' makes a new service worker activate (skipWaiting + clientsClaim)
// as soon as it's installed, but that alone only changes which SW answers FUTURE network
// requests - a tab that's been open since before the deploy keeps running the JS bundle it
// already loaded into memory until it actually reloads. Without this listener, a long-lived
// tab (or a user who never hard-refreshes) can be stuck on stale code indefinitely even
// though the "fix" has been live on the server the whole time - confirmed the hard way this
// session on a tab that had been open across a deploy. Reloading once when a new SW takes
// control is the standard fix; the `refreshing` guard stops it from looping.
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // virtual:pwa-register is provided by vite-plugin-pwa
  try {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true })

      if ('serviceWorker' in navigator) {
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      }
    }).catch(() => {
      // Fail silently if the environment doesn't support virtual registration (e.g., during tests)
    })
  } catch {
    // Fail silently if the environment doesn't support virtual registration (e.g., during tests)
  }
}

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
