/**
 * Sidebar — Chart controls panel (left side).
 *
 * Contains: Symbol, Timeframe, Presets, Indicators, ATR Gauge.
 * Collapsible on desktop, drawer overlay on mobile.
 */

import { useChartStore } from '../../store/useChartStore'
import { SymbolInput } from '../chart/SymbolInput'
import { TimeframeSelector } from '../chart/TimeframeSelector'
import { PresetSelector } from '../ui/PresetSelector'
import { IndicatorToggle } from '../ui/IndicatorToggle'
import { ATRGauge } from '../ui/ATRGauge'

export function Sidebar({ atrGauge }) {
  const sidebarOpen   = useChartStore((s) => s.sidebarOpen)
  const setSidebarOpen = useChartStore((s) => s.setSidebarOpen)
  const theme         = useChartStore((s) => s.theme)

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          flex flex-col shrink-0 border-r border-gray-800 transition-all duration-200 overflow-hidden z-40
          fixed md:relative inset-y-0 left-0
          ${sidebarOpen ? 'w-48 translate-x-0' : 'w-0 -translate-x-full md:w-10 md:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex items-center justify-center h-10 border-b border-gray-800 text-gray-300 hover:text-gray-300 hover:bg-gray-800 transition-colors shrink-0 text-xs font-semibold"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        <div
          className="flex flex-col gap-5 px-3 py-4 overflow-y-auto flex-1 transition-opacity duration-200"
          style={{
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            minWidth: 168,
          }}
        >
          <div>
            <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-1">Symbol</div>
            <SymbolInput />
          </div>

          <div className="h-px bg-gray-800" />

          <div>
            <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-2">Timeframe</div>
            <TimeframeSelector />
          </div>

          <div className="h-px bg-gray-800" />

          <div>
            <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-2">Presets</div>
            <PresetSelector />
          </div>

          <div className="h-px bg-gray-800" />

          <div>
            <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-2">Indicators</div>
            <IndicatorToggle />
          </div>

          {atrGauge && (
            <div className="mt-auto">
              <div className="h-px bg-gray-800 mb-4" />
              <ATRGauge
                atrValue={atrGauge.atrValue}
                rangeUsed={atrGauge.rangeUsed}
                percentConsumed={atrGauge.percentConsumed}
                theme={theme}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
