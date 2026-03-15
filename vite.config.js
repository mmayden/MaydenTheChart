import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'lightweight-charts': ['lightweight-charts'],
          'vendor-api': ['axios', '@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    // Proxy /api requests to the local dev API server (run with: vercel dev)
    // This lets `npm run dev` work alongside `vercel dev` on port 3000
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
