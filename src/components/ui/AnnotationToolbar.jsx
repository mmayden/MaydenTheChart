/**
 * AnnotationToolbar — Floating toolbar for chart annotation mode.
 *
 * Shows when annotation mode is active or when user hovers the draw area.
 * Three tools: Text note, Arrow, Horizontal line.
 * Also shows a count of annotations + clear button for current symbol.
 */

import { useChartStore } from '../../store/useChartStore'
import { useAnnotationsStore } from '../../store/useAnnotationsStore'

const TOOLS = [
  {
    id: 'text',
    label: 'Note',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
  {
    id: 'hline',
    label: 'Line',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
]

export function AnnotationToolbar() {
  const annotationMode   = useChartStore((s) => s.annotationMode)
  const setAnnotationMode = useChartStore((s) => s.setAnnotationMode)
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const annotations       = useAnnotationsStore((s) => s.getAnnotations(selectedSymbol))
  const clearAnnotations  = useAnnotationsStore((s) => s.clearAnnotations)

  return (
    <div
      className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-lg border border-theme-mid px-1.5 py-1"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 90%, transparent)' }}
    >
      {TOOLS.map(({ id, label, icon }) => {
        const active = annotationMode === id
        return (
          <button
            key={id}
            onClick={() => setAnnotationMode(id)}
            className={[
              'flex items-center justify-center w-7 h-7 rounded transition-colors touch-target',
              active
                ? 'bg-accent-dim text-accent border border-accent'
                : 'text-theme-muted hover:text-theme hover:bg-theme-hover border border-transparent',
            ].join(' ')}
            title={`${label}${active ? ' (active — click chart to place)' : ''}`}
          >
            {icon}
          </button>
        )
      })}

      {/* Annotation count + clear */}
      {annotations.length > 0 && (
        <>
          <div className="w-px h-4 bg-theme-border mx-0.5" />
          <span className="text-[10px] text-theme-muted tabular-nums px-1">{annotations.length}</span>
          <button
            onClick={() => clearAnnotations(selectedSymbol)}
            className="flex items-center justify-center w-6 h-6 rounded text-theme-muted hover:text-bear hover:bg-theme-hover transition-colors touch-target"
            title="Clear all annotations"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
