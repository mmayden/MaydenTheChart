/**
 * Sidebar — Chart controls panel (left side).
 *
 * Contains: Symbol, Timeframe, Presets, Indicators, ATR Gauge.
 * Collapsible on desktop, drawer overlay on mobile.
 *
 * Layout approach: mirrors RightPanel — persistent wrapper div always in DOM
 * with CSS width/min-width transitions. Border lives on inner content, not
 * the wrapper, so the wrapper can truly collapse to 0px.
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

      {/* Sidebar wrapper — always in DOM so width transitions are seamless.
          On mobile: fixed overlay, slides via translateX.
          On desktop: relative in flex layout, width transitions smoothly.
          Border is on inner content, NOT on wrapper — so wrapper truly collapses to 0. */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40',
          'md:relative md:z-auto md:inset-y-auto md:left-auto',
          'shrink-0 overflow-hidden',
          'transition-[transform,width,min-width] duration-200 ease-out',
          sidebarOpen
            ? 'w-48 min-w-[192px] translate-x-0'
            : 'w-0 min-w-0 -translate-x-full md:translate-x-0 pointer-events-none',
        ].join(' ')}
        style={{ backgroundColor: sidebarOpen ? 'var(--bg-surface)' : 'transparent' }}
      >
        <div
          className="flex flex-col h-full w-48 border-r border-theme"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div
            className="flex flex-col gap-5 px-3 py-4 overflow-y-auto flex-1"
            style={{
              opacity: sidebarOpen ? 1 : 0,
              transition: 'opacity 150ms',
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
        </div>
      </aside>
    </>
  )
}
