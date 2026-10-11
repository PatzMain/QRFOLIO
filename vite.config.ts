import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon-v2.png', 'screenshot.png', 'screenshot-desktop.png', 'third-party/LICENSES.txt', 'third-party/EMBEDDED-NOTICES.txt', 'third-party/inventory.json', 'fonts/OFL-Inter.txt'],
      manifest: {
        id: '/',
        start_url: '/',
        scope: '/',
        name: 'QRFolio',
        short_name: 'QRFolio',
        description: 'Offline-first QR Code manager, generator, and scanner',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        prefer_related_applications: false,
        icons: [
          {
            src: 'pwa-192x192-v2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'QRFolio Mobile'
          },
          {
            src: 'screenshot-desktop.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'QRFolio Desktop'
          }
        ]
      }
    }),
    basicSsl()
  ],
  server: {
    host: true,
    port: 5173,
    https: {},
  },
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('html5-qrcode')) {
            return 'html5-qrcode'
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
  },
})
