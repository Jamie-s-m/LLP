import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeTheme } from './store/themeStore'

// Register PWA service worker in production for offline support and update handling
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // virtual:pwa-register is provided by vite-plugin-pwa
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { registerSW } = require('virtual:pwa-register')
    const updateSW = registerSW({ immediate: true })
    // optional: subscribe to update events
    updateSW && updateSW.then(() => {})
  } catch (err) {
    // Fail silently if the environment doesn't support virtual registration (e.g., during tests)
    // console.warn('PWA registration skipped', err)
  }
}

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
