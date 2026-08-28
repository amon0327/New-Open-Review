import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: null,
        // Supabase API (rest / functions / auth) は絶対にキャッシュしない (動的データ)
        runtimeCaching: [
          {
            urlPattern: /supabase\.co\/(rest|functions|auth)\/v\d/,
            handler: 'NetworkOnly'
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: '店舗管理',
        short_name: '店舗管理',
        description: '店舗管理PWAアプリ',
        theme_color: '#5e17eb',
        background_color: '#f5f5f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/staff-app/logo/StoreManagementAppLogo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/staff-app/logo/StoreManagementAppLogo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})