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
  const sidebarOpen    = useChartStore((s) => s.sidebarOpen)
  const setSidebarOpen = useChartStore((s) => s.setSidebarOpen)
  const theme          = useChartStore((s) => s.theme)

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
          flex flex-col shrink-0 border-r border-theme overflow-hidden z-40
          fixed md:relative inset-y-0 left-0
          transition-transform duration-200 md:transition-none
          ${sidebarOpen ? 'w-48 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div
          className="flex flex-col gap-5 px-3 py-4 overflow-y-auto flex-1 transition-opacity duration-200"
          style={{
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            minWidth: 168,
          }}
        >
          <div>
            <div className="text-[10px] tracking-widest font-semibold uppercase mb-1" style={{ color: 'var(--symbol-color)' }}>Symbol</div>
            <SymbolInput />
          </div>

          <div className="h-px bg-theme-border" />

          <div>
            <div className="text-[10px] tracking-widest text-theme font-semibold uppercase mb-2">Timeframe</div>
            <TimeframeSelector />
          </div>

          <div className="h-px bg-theme-border" />

          <div data-tour="presets">
            <div className="text-[10px] tracking-widest text-theme font-semibold uppercase mb-2">Presets</div>
            <PresetSelector />
          </div>

          <div className="h-px bg-theme-border" />

          <div>
            <div className="text-[10px] tracking-widest text-theme font-semibold uppercase mb-2">Indicators</div>
            <IndicatorToggle />
          </div>

          {atrGauge && (
            <div data-tour="atr-gauge">
              <div className="h-px bg-theme-border mb-4" />
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
