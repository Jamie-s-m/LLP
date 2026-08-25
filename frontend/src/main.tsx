import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeTheme } from './store/themeStore'

// Register PWA service worker in production for offline support and update handling
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // virtual:pwa-register is provided by vite-plugin-pwa
  try {
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({ immediate: true })
      updateSW && updateSW.then(() => {})
    }).catch(() => {
      // Fail silently if the environment doesn't support virtual registration (e.g., during tests)
    })
  } catch (err) {
    // Fail silently if the environment doesn't support virtual registration (e.g., during tests)
  }
}

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
