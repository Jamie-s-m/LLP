import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      // injectManifest (not the default generateSW): the service worker source is
      // hand-written at src/sw.js so it can also handle 'push'/'notificationclick' - those
      // don't exist under generateSW, which only ever emits its own auto-generated file and
      // would silently overwrite anything else living at the same output path.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'linguanest-mark.svg', 'linguanest-orbit.svg'],
      manifest: {
        name: 'LinguaNest',
        short_name: 'LinguaNest',
        description: 'Language mastery, shaped with clarity. Learn. Speak. Belong.',
        id: '/',
        start_url: '/',
        display: 'standalone',
        background_color: '#FDF8F3',
        theme_color: '#C84B31',
        orientation: 'portrait-primary',
        scope: '/',
        icons: [
          {
            src: './icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['education', 'productivity'],
        shortcuts: [
          {
            name: 'My Learning',
            short_name: 'Learn',
            description: 'Continue your language learning journey',
            url: './my-learning',
            icons: [{ src: './icons/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Flashcards',
            short_name: 'Cards',
            description: 'Practice vocabulary with flashcards',
            url: './flashcards',
            icons: [{ src: './icons/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Courses',
            short_name: 'Courses',
            description: 'Browse available courses',
            url: './courses',
            icons: [{ src: './icons/icon-192x192.png', sizes: '192x192' }]
          }
        ],
        prefer_related_applications: false,
      },
      // generateSW's declarative `workbox.runtimeCaching` config doesn't apply under
      // injectManifest - the same caching rules now live as explicit registerRoute() calls
      // in src/sw.js instead. injectManifest only takes the precache glob config here.
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Routes are lazy-loaded, so preloading shared vendor chunks on every entry page only
    // creates unused requests and console warnings. Dynamic imports still fetch these chunks
    // when a route actually needs them.
    modulePreload: false,
    rollupOptions: {
      output: {
        // A function, not the plain {name: [packages]} object this used to be: the object form
        // matches package names as plain substrings of the resolved module id, which broke on
        // Windows-style backslash paths for a scoped subpath import (react/jsx-runtime) - it
        // silently never matched, so Rollup was free to physically place that shared runtime
        // shim wherever its own graph coloring picked, which turned out to be inside
        // charts-vendor (recharts also depends on it). Since EVERY compiled JSX file calls into
        // jsx-runtime, that meant every single page - not just the two chart-using routes - had
        // to eagerly load charts-vendor just to render anything at all. Confirmed directly in
        // the built output (`import{j as i}from"./charts-vendor-*.js"` at the top of the main
        // entry chunk) after live PageSpeed testing showed charts-vendor loading, still unused,
        // on the Home page. Matching with a regex character class ([\\/]) here instead handles
        // both path separators regardless of OS.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]react[\\/]jsx-runtime|[\\/]react[\\/]|[\\/]react-dom[\\/]|[\\/]react-router-dom[\\/]/.test(id)) {
            return 'react-vendor'
          }
          if (/[\\/]framer-motion[\\/]|[\\/]react-hot-toast[\\/]|[\\/]react-icons[\\/]/.test(id)) {
            return 'ui-vendor'
          }
          if (/[\\/]zustand[\\/]|[\\/]axios[\\/]/.test(id)) {
            return 'store-vendor'
          }
          // Phase 20: recharts (~150kb) and dotlottie-react pulled into their own chunk so only
          // the routes that actually render a chart/celebration animation pay for them, instead
          // of bloating every route's own chunk (recharts alone pushed Dashboard's chunk past
          // every other route's before this split).
          if (/[\\/]recharts[\\/]|[\\/]@lottiefiles[\\/]/.test(id)) {
            return 'charts-vendor'
          }
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}))