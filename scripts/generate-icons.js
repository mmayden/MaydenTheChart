/**
 * Generate branded PWA icons (192x192 and 512x512) from SVG.
 *
 * Uses the same brand colors as the logo gradient (gold → amber → burnt orange).
 * Icon: dark rounded square with a stylized candlestick chart + "C" monogram.
 *
 * Run: node scripts/generate-icons.js
 * Output: public/icons/icon-192.png, public/icons/icon-512.png
 * Requires: sharp (devDep)
 */

import { writeFileSync } from 'fs'

const GOLD = '#F5C842'
const AMBER = '#E8A020'
const BURNT = '#C96B0A'
const BG = '#0a0a0a'
const SURFACE = '#111318'
const BULL = '#22c55e'
const BEAR = '#ef4444'

function generateIconSvg(size) {
  const pad = Math.round(size * 0.1)
  const inner = size - pad * 2
  const cx = size / 2
  const radius = Math.round(size * 0.18)

  // Mini candlestick chart in the background
  const chartX = Math.round(size * 0.22)
  const chartW = Math.round(size * 0.56)
  const chartY = Math.round(size * 0.3)
  const chartH = Math.round(size * 0.45)
  const candleCount = 5
  const candleW = Math.floor(chartW / candleCount)
  const gap = Math.round(candleW * 0.2)

  const candles = [
    { o: 0.5, h: 0.7, l: 0.3, c: 0.6 },
    { o: 0.6, h: 0.8, l: 0.45, c: 0.45 },
    { o: 0.45, h: 0.65, l: 0.35, c: 0.55 },
    { o: 0.55, h: 0.9, l: 0.5, c: 0.85 },
    { o: 0.85, h: 0.95, l: 0.7, c: 0.9 },
  ]

  const candleSvg = candles.map((c, i) => {
    const x = chartX + i * candleW + gap / 2
    const w = candleW - gap
    const bull = c.c >= c.o
    const color = bull ? BULL : BEAR
    const bodyTop = chartY + chartH * (1 - Math.max(c.o, c.c))
    const bodyBot = chartY + chartH * (1 - Math.min(c.o, c.c))
    const bodyH = Math.max(bodyBot - bodyTop, 1)
    const wickX = x + w / 2
    const wickTop = chartY + chartH * (1 - c.h)
    const wickBot = chartY + chartH * (1 - c.l)
    const sw = Math.max(1, Math.round(size * 0.006))
    const rx = Math.max(1, Math.round(size * 0.006))

    return `
      <line x1="${wickX}" y1="${wickTop}" x2="${wickX}" y2="${wickBot}" stroke="${color}" stroke-width="${sw}" stroke-opacity="0.6"/>
      <rect x="${x}" y="${bodyTop}" width="${w}" height="${bodyH}" fill="${color}" fill-opacity="0.5" rx="${rx}"/>
    `
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GOLD}"/>
      <stop offset="55%" stop-color="${AMBER}"/>
      <stop offset="100%" stop-color="${BURNT}"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
  </defs>

  <!-- Rounded background -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bgGrad)"/>

  <!-- Candlestick chart (background decoration) -->
  ${candleSvg}

  <!-- "C" monogram in gold gradient -->
  <text x="${cx}" y="${Math.round(size * 0.68)}" text-anchor="middle"
        font-family="monospace, sans-serif" font-size="${Math.round(size * 0.52)}" font-weight="bold"
        fill="url(#textGrad)" opacity="0.95">C</text>

  <!-- Subtle border -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="none" stroke="${AMBER}" stroke-opacity="0.2" stroke-width="${Math.max(1, Math.round(size * 0.004))}"/>
</svg>`
}

// Generate SVGs
const svg192 = generateIconSvg(192)
const svg512 = generateIconSvg(512)

writeFileSync('public/icons/icon-192.svg', svg192)
writeFileSync('public/icons/icon-512.svg', svg512)
console.log('Generated SVG icons')

// Convert to PNG via sharp
try {
  const { default: sharp } = await import('sharp')
  await sharp(Buffer.from(svg192)).png().toFile('public/icons/icon-192.png')
  await sharp(Buffer.from(svg512)).png().toFile('public/icons/icon-512.png')
  console.log('Generated public/icons/icon-192.png (192x192)')
  console.log('Generated public/icons/icon-512.png (512x512)')
} catch {
  console.log('sharp not installed — SVGs only. Run `npm i -D sharp` for PNG output.')
}
