/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:      '#0a0a0a',
          surface: '#111111',
          border:  '#1f2937',
          muted:   '#374151',
        },
        ema: {
          9:   '#3b82f6',   // blue  — EMA 9
          48:  '#22c55e',   // green — EMA 48
          200: '#e5e7eb',   // white — EMA 200
        },
        vwap:    '#06b6d4',    // cyan
        level:   '#eab308',    // gold — prev day H/L
        orb:     '#6366f1',    // indigo — ORB zone
        // Semantic data colors — bull/bear, status, warnings
        bull:    '#22c55e',
        bear:    '#ef4444',
        warn:    '#eab308',
        info:    '#60a5fa',
        neutral: '#6b7280',
        badge:   '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
