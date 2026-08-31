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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-hot-toast', 'react-icons'],
          'store-vendor': ['zustand', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}))