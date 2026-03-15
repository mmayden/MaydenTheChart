/**
 * Chart snapshot utilities — capture, watermark, and export chart screenshots.
 *
 * Uses lightweight-charts v5 takeScreenshot() which returns an HTMLCanvasElement.
 */

/**
 * Capture a chart screenshot with a watermark overlay.
 * Returns a Promise<Blob> of the PNG image.
 *
 * @param {HTMLCanvasElement} canvas — from chart.takeScreenshot()
 * @param {Object} opts
 * @param {string} opts.symbol    — current symbol (e.g. 'QQQ')
 * @param {string} opts.timeframe — current timeframe label (e.g. '5m')
 * @returns {Promise<Blob>}
 */
export function captureSnapshot(canvas, { symbol = '', timeframe = '' } = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  // Draw watermark in bottom-right corner
  const padding = 12
  const text = `${symbol} ${timeframe} · cheechart.space · ${new Date().toLocaleDateString()}`

  ctx.save()
  ctx.font = '11px monospace'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, canvas.width - padding, canvas.height - padding)
  ctx.restore()

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/**
 * Copy a Blob to the clipboard. Falls back to download if clipboard API unavailable.
 *
 * @param {Blob} blob — the image blob
 * @param {string} filename — fallback download filename
 * @returns {Promise<'clipboard'|'download'>} — which method was used
 */
export async function copyToClipboard(blob, filename = 'cheechart-snapshot.png') {
  if (blob && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      return 'clipboard'
    } catch {
      // Fall through to download
    }
  }

  downloadSnapshot(blob, filename)
  return 'download'
}

/**
 * Download a Blob as a file.
 *
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadSnapshot(blob, filename = 'cheechart-snapshot.png') {
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Cleanup after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 100)
}
