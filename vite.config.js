import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'

/**
 * Vite plugin: auto-version the service worker.
 * Reads src/sw.js, replaces __BUILD_HASH__ with a content hash
 * derived from the built assets, and writes dist/sw.js.
 */
function serviceWorkerVersion() {
  return {
    name: 'sw-version',
    apply: 'build',
    closeBundle() {
      const swSource = readFileSync(resolve(import.meta.dirname, 'src/sw.js'), 'utf-8')
      // Hash based on the SW source + current timestamp for uniqueness per deploy
      const hash = createHash('md5')
        .update(swSource + Date.now())
        .digest('hex')
        .slice(0, 8)
      const swOut = swSource.replace('__BUILD_HASH__', `cheechart-${hash}`)
      writeFileSync(resolve(import.meta.dirname, 'dist/sw.js'), swOut)
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorkerVersion()],
  test: {
    environment: 'node',
    globals: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        roadmap: resolve(import.meta.dirname, 'roadmap.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lightweight-charts')) return 'lightweight-charts'
          if (id.includes('node_modules/axios') || id.includes('node_modules/@tanstack/react-query')) return 'vendor-api'
          if (id.includes('node_modules/motion')) return 'motion'
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
