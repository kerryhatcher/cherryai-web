import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The SPA calls the API same-origin at /api; dev and preview proxy those
// requests to the backend. Override the target per machine via
// API_PROXY_TARGET in the environment or .env.local.
function resolveProxyTarget(mode: string): string {
  const env = loadEnv(mode, process.cwd(), '')
  return (
    process.env.API_PROXY_TARGET ??
    env.API_PROXY_TARGET ??
    'http://localhost:8000'
  )
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Listen on all interfaces so the app is reachable over Tailscale;
  // `.ts.net` permits any tailnet MagicDNS hostname (raw IPs always pass).
  server: {
    host: true,
    allowedHosts: ['.ts.net'],
    proxy: {
      '/api': { target: resolveProxyTarget(mode), changeOrigin: true },
    },
  },
  preview: {
    host: true,
    allowedHosts: ['.ts.net'],
    proxy: {
      '/api': { target: resolveProxyTarget(mode), changeOrigin: true },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'CherryAI',
        short_name: 'CherryAI',
        description: 'Chat with CherryAI.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#aa3bff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
