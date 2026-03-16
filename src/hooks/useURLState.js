/**
 * useURLState — Syncs chart state with URL search params.
 *
 * Enables shareable/bookmarkable chart views:
 *   cheechart.space?s=QQQ&tf=5m&p=full&panel=backtest
 *
 * On mount: reads URL params and applies to stores.
 * On state change: updates URL params (replaceState, no navigation).
 */

import { useEffect, useRef } from 'react'
import { useChartStore } from '../store/useChartStore'
import { usePresetsStore } from '../store/usePresetsStore'
import { TIMEFRAME_CONFIG, DEFAULT_SYMBOL, DEFAULT_TIMEFRAME } from '../constants/chart'
import { SYMBOL_RE } from '../constants/patterns'

// Map between URL-friendly labels and internal timeframe keys
const TF_TO_LABEL = {}
const LABEL_TO_TF = {}
Object.entries(TIMEFRAME_CONFIG).forEach(([key, cfg]) => {
  const label = cfg.label.toLowerCase()
  TF_TO_LABEL[key] = label
  LABEL_TO_TF[label] = key
})

const VALID_PANELS = new Set(['alerts', 'backtest', 'journal', 'watchlist'])

export function useURLState() {
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const activePanel       = useChartStore((s) => s.activePanel)
  const setSymbol         = useChartStore((s) => s.setSymbol)
  const setTimeframe      = useChartStore((s) => s.setTimeframe)
  const setActivePanel    = useChartStore((s) => s.setActivePanel)
  const activePresetId    = usePresetsStore((s) => s.activePresetId)
  const applyPreset       = usePresetsStore((s) => s.applyPreset)
  const initialized       = useRef(false)

  // On mount: read URL params and apply to stores
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s     = params.get('s')
    const tf    = params.get('tf')
    const p     = params.get('p')
    const panel = params.get('panel')

    if (s && SYMBOL_RE.test(s.toUpperCase()) && s.toUpperCase() !== DEFAULT_SYMBOL) setSymbol(s.toUpperCase())
    if (tf) {
      const tfKey = LABEL_TO_TF[tf.toLowerCase()]
      if (tfKey) setTimeframe(tfKey)
    }
    if (p) applyPreset(p)
    if (panel && VALID_PANELS.has(panel)) setActivePanel(panel)

    initialized.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On state change: update URL (no navigation, just replaceState)
  useEffect(() => {
    if (!initialized.current) return

    const params = new URLSearchParams()
    if (selectedSymbol !== DEFAULT_SYMBOL) params.set('s', selectedSymbol)
    if (selectedTimeframe !== DEFAULT_TIMEFRAME) params.set('tf', TF_TO_LABEL[selectedTimeframe] || selectedTimeframe)
    if (activePresetId) params.set('p', activePresetId)
    if (activePanel) params.set('panel', activePanel)

    const search = params.toString()
    const newUrl = search ? `/?${search}` : '/'

    window.history.replaceState(null, '', newUrl)
  }, [selectedSymbol, selectedTimeframe, activePresetId, activePanel])
}
