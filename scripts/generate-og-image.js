/**
 * Generate a branded OG image (1200x630) for social link previews.
 *
 * Uses pure Node.js canvas-free approach: outputs an SVG that can be
 * viewed directly or converted to PNG. For now, we generate an SVG
 * and reference it as the OG image — most social platforms accept SVG
 * via URL, but for maximum compatibility we embed it as a static PNG.
 *
 * Run: node scripts/generate-og-image.js
 * Output: public/og-image.png (via SVG → PNG if sharp is available, else SVG)
 */

import { writeFileSync } from 'fs'

// Brand colors (dark theme)
const BG = '#0a0a0a'
const SURFACE = '#0d1117'
const ACCENT = '#60a5fa'
const BULL = '#22c55e'
const BEAR = '#ef4444'
const MUTED = '#6b7280'
const TEXT = '#f3f4f6'

// Fake candlestick data for visual interest
const candles = [
  { o: 380, h: 395, l: 375, c: 390 },
  { o: 390, h: 400, l: 385, c: 398 },
  { o: 398, h: 405, l: 390, c: 392 },
  { o: 392, h: 396, l: 380, c: 382 },
  { o: 382, h: 390, l: 378, c: 388 },
  { o: 388, h: 402, l: 386, c: 400 },
  { o: 400, h: 415, l: 398, c: 412 },
  { o: 412, h: 420, l: 408, c: 418 },
  { o: 418, h: 422, l: 410, c: 414 },
  { o: 414, h: 425, l: 412, c: 422 },
  { o: 422, h: 430, l: 418, c: 416 },
  { o: 416, h: 420, l: 405, c: 408 },
  { o: 408, h: 415, l: 404, c: 413 },
  { o: 413, h: 428, l: 410, c: 426 },
  { o: 426, h: 435, l: 424, c: 432 },
  { o: 432, h: 440, l: 428, c: 438 },
]

const W = 1200
const H = 630

// Chart area
const chartX = 80
const chartY = 140
const chartW = W - 160
const chartH = 320
const candleW = Math.floor(chartW / candles.length)
const gap = 4

// Price range
const allPrices = candles.flatMap(c => [c.h, c.l])
const minP = Math.min(...allPrices)
const maxP = Math.max(...allPrices)
const priceRange = maxP - minP

function yPos(price) {
  return chartY + chartH - ((price - minP) / priceRange) * chartH
}

// Build candle SVG elements
const candleSvg = candles.map((c, i) => {
  const x = chartX + i * candleW + gap / 2
  const w = candleW - gap
  const bull = c.c >= c.o
  const color = bull ? BULL : BEAR
  const bodyTop = yPos(Math.max(c.o, c.c))
  const bodyBot = yPos(Math.min(c.o, c.c))
  const bodyH = Math.max(bodyBot - bodyTop, 1)
  const wickX = x + w / 2

  return `
    <line x1="${wickX}" y1="${yPos(c.h)}" x2="${wickX}" y2="${yPos(c.l)}" stroke="${color}" stroke-width="1.5"/>
    <rect x="${x}" y="${bodyTop}" width="${w}" height="${bodyH}" fill="${color}" rx="1"/>
  `
}).join('')

// EMA-like curve (smoothed closes)
const emaPoints = candles.map((c, i) => {
  const x = chartX + i * candleW + candleW / 2
  const y = yPos(c.c)
  return `${x},${y}`
}).join(' ')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

  <!-- Grid lines -->
  ${[0.25, 0.5, 0.75].map(f => {
    const y = chartY + chartH * f
    return `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${MUTED}" stroke-opacity="0.15" stroke-dasharray="4,4"/>`
  }).join('')}

  <!-- Candles -->
  ${candleSvg}

  <!-- EMA line -->
  <polyline points="${emaPoints}" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-opacity="0.6" stroke-linejoin="round"/>

  <!-- Title -->
  <text x="${W / 2}" y="60" text-anchor="middle" font-family="monospace" font-size="42" font-weight="bold" fill="${TEXT}">Cheechart</text>

  <!-- Tagline -->
  <text x="${W / 2}" y="100" text-anchor="middle" font-family="monospace" font-size="18" fill="${MUTED}">Free charting — unlimited indicators, no signup, no ads</text>

  <!-- Bottom URL -->
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-family="monospace" font-size="16" fill="${ACCENT}">cheechart.space</text>

  <!-- Confluence badge -->
  <rect x="${W / 2 - 100}" y="${H - 80}" width="200" height="28" rx="14" fill="${BULL}" fill-opacity="0.15" stroke="${BULL}" stroke-opacity="0.3"/>
  <text x="${W / 2}" y="${H - 61}" text-anchor="middle" font-family="monospace" font-size="13" fill="${BULL}">Confluence 85 · Bull</text>

  <!-- Border -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${MUTED}" stroke-opacity="0.2" rx="8"/>
</svg>`

// Write SVG
writeFileSync('public/og-image.svg', svg)
console.log('Generated public/og-image.svg (1200x630)')

// Try to convert to PNG if sharp is available
try {
  const { default: sharp } = await import('sharp')
  await sharp(Buffer.from(svg)).png().toFile('public/og-image.png')
  console.log('Generated public/og-image.png')
} catch {
  console.log('sharp not installed — using SVG directly. Run `npm i -D sharp` to generate PNG.')
  // Copy SVG content to a simple HTML file that can be screenshot-captured
}
