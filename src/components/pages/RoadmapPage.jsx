/**
 * RoadmapPage — Trading Roadmap interactive learning tracker.
 *
 * Standalone page at /roadmap (separate Vite entry via roadmap-main.jsx).
 * 16 phases, 86 topics with progress tracking via localStorage.
 * Themed via CSS custom properties — inherits the app's theme system.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { PHASES, BEGINNER_PHASE_IDS, BEGINNER_NODE_COUNT } from '../../constants/roadmap'
import { useIsMobile } from '../../hooks/useMediaQuery'

const STORAGE_KEY = 'cheechart-roadmap-done'
const BEGINNER_KEY = 'cheechart-roadmap-beginner'

function loadDone() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveDone(done) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
  } catch { /* storage unavailable */ }
}

const TOTAL_NODES = PHASES.reduce((s, p) => s + p.nodes.length, 0)

// ── Difficulty dots ─────────────────────────────────────────────────────────
function DiffDots({ diff, color, size = 'sm' }) {
  const dotClass = size === 'lg' ? 'w-5 h-1 rounded-sm' : 'w-1.5 h-1.5 rounded-full'
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={dotClass}
          style={{ backgroundColor: i <= diff ? color : 'var(--bg-hover)' }}
        />
      ))}
    </div>
  )
}

// ── Node card ───────────────────────────────────────────────────────────────
function NodeCard({ node, phase, isDone, isActive, onToggleDone, onSelect }) {
  return (
    <button
      type="button"
      className={[
        'roadmap-node text-left w-full rounded-lg border p-3 flex items-start gap-3 transition-all',
        isActive ? 'border-accent/60 roadmap-node-active' : 'border-theme hover:border-theme-mid',
        isDone ? 'opacity-50' : '',
      ].join(' ')}
      style={{
        backgroundColor: isActive ? phase.bg : 'var(--bg-surface)',
        '--phase-color': phase.color,
      }}
      onClick={() => onSelect(node.id)}
    >
      {/* Checkbox */}
      <div
        className="w-4.5 h-4.5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer"
        style={{
          borderColor: isDone ? phase.check : 'var(--bg-hover)',
          backgroundColor: isDone ? phase.check : 'transparent',
        }}
        onClick={(e) => { e.stopPropagation(); onToggleDone(node.id) }}
        role="checkbox"
        aria-checked={isDone}
        aria-label={`Mark "${node.title}" as ${isDone ? 'incomplete' : 'complete'}`}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold leading-tight ${isDone ? 'line-through' : ''}`}
          style={{ color: 'var(--text-primary)' }}>
          {node.title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {node.sub}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
            style={{ color: phase.color, borderColor: `${phase.color}40`, backgroundColor: phase.bg }}
          >
            {node.phase}
          </span>
          <div className="ml-auto">
            <DiffDots diff={node.diff} color={phase.color} />
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ node, phase, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [node?.id])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!node || !phase) return null

  return (
    <div
      ref={panelRef}
      className="roadmap-detail overflow-y-auto"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg border border-theme-mid flex items-center justify-center text-theme-muted hover:text-theme transition-colors z-10"
        style={{ backgroundColor: 'var(--bg-hover)' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
        </svg>
      </button>

      {/* Phase tag */}
      <span
        className="inline-block text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border mb-3"
        style={{ color: phase.color, borderColor: `${phase.color}40`, backgroundColor: phase.bg }}
      >
        {node.phase} &middot; {phase.label.split('—')[0].trim()}
      </span>

      <h2 className="text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
        {node.title}
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{node.sub}</p>

      {/* Difficulty */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Difficulty</span>
        <DiffDots diff={node.diff} color={phase.color} size="lg" />
      </div>

      {/* Summary */}
      <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
        {node.summary}
      </p>

      {/* Concepts */}
      <section className="mb-5">
        <h3 className="roadmap-section-title">Concepts Covered</h3>
        <ul className="space-y-0">
          {node.concepts.map((c, i) => (
            <li key={i} className="flex items-start gap-2 py-1.5 border-b border-theme text-xs leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}>
              <span className="text-theme-muted shrink-0 text-base leading-none">&middot;</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* Resources */}
      <section className="mb-5">
        <h3 className="roadmap-section-title">Recommended Resources</h3>
        <ul className="space-y-0">
          {node.resources.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 py-2 border-b border-theme text-xs">
              <span
                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 mt-0.5"
                style={{ borderColor: 'var(--border-mid)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              >
                {r.type}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tip */}
      <div
        className="rounded-lg border p-3 text-xs leading-relaxed"
        style={{
          borderColor: 'var(--border-base)',
          borderLeftWidth: '3px',
          borderLeftColor: phase.color,
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-muted)',
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Pro Tip:</strong> {node.tip}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export function RoadmapPage() {
  const isMobile = useIsMobile()
  const [done, setDone] = useState(loadDone)
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [beginnerOnly, setBeginnerOnly] = useState(() => {
    try { return localStorage.getItem(BEGINNER_KEY) === 'true' } catch { return false }
  })

  const toggleBeginner = useCallback(() => {
    setBeginnerOnly((prev) => {
      const next = !prev
      try { localStorage.setItem(BEGINNER_KEY, String(next)) } catch { /* */ }
      return next
    })
  }, [])

  const toggleDone = useCallback((id) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveDone(next)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    setDone(new Set())
    saveDone(new Set())
  }, [])

  const closePanel = useCallback(() => setActiveId(null), [])

  // Find the active node + phase
  let activeNode = null
  if (activeId) {
    for (const phase of PHASES) {
      const node = phase.nodes.find((n) => n.id === activeId)
      if (node) { activeNode = { node, phase }; break }
    }
  }

  // Filter phases by search + beginner mode
  const filteredPhases = useMemo(() => {
    let phases = beginnerOnly ? PHASES.filter((p) => BEGINNER_PHASE_IDS.has(p.id)) : PHASES
    if (!search.trim()) return phases
    const q = search.trim().toLowerCase()
    return phases.map((phase) => ({
      ...phase,
      nodes: phase.nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.sub.toLowerCase().includes(q) ||
          n.concepts.some((c) => c.toLowerCase().includes(q)) ||
          n.phase.toLowerCase().includes(q)
      ),
    })).filter((p) => p.nodes.length > 0)
  }, [search, beginnerOnly])

  // Per-phase completion for mastered badges
  const phaseCompletion = useMemo(() => {
    const map = {}
    for (const phase of PHASES) {
      const total = phase.nodes.length
      const completed = phase.nodes.filter((n) => done.has(n.id)).length
      map[phase.id] = { total, completed, mastered: total > 0 && completed === total }
    }
    return map
  }, [done])

  const pct = TOTAL_NODES > 0 ? Math.round((done.size / TOTAL_NODES) * 100) : 0
  const panelOpen = activeNode !== null

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Progress header */}
      <div
        className="flex items-center gap-3 px-5 py-2.5 border-b border-theme shrink-0"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          <span className="text-accent font-medium">{done.size}</span>
          <span style={{ opacity: 0.5 }}> / </span>
          {TOTAL_NODES} done
        </span>
        <div className="w-28 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))' }}
          />
        </div>
        <span className="text-[11px] font-mono font-medium text-accent">{pct}%</span>
        {done.size > 0 && (
          <button
            onClick={resetProgress}
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded border border-theme-mid text-theme-muted hover:text-theme hover:bg-theme-hover transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Roadmap content */}
        <div
          className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 py-4' : 'px-6 py-6'}`}
          style={{ maxWidth: panelOpen && !isMobile ? 'calc(100% - 380px)' : '100%' }}
        >
          {/* Hero */}
          <div className="text-center mb-8">
            <span
              className="inline-block text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border mb-4"
              style={{ color: 'var(--accent)', borderColor: 'var(--accent-dim)', backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}
            >
              Complete Deep-Dive Roadmap
            </span>
            <h1 className={`font-semibold tracking-tight leading-tight mb-3 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              Trading Mastery<br />
              <span className="text-accent">The Full Path</span>
            </h1>
            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {beginnerOnly
                ? 'A curated path through the essentials — chart literacy, key indicators, risk management, and trading psychology. Master these before going deeper.'
                : '16 phases. 86 topics. Every concept, tool, and discipline you need — from market fundamentals to professional-grade execution. Click any node to explore in depth.'}
            </p>
            <div className="flex justify-center gap-8 mt-5">
              {[
                { num: beginnerOnly ? String(BEGINNER_PHASE_IDS.size) : '16', lbl: 'Phases' },
                { num: beginnerOnly ? String(BEGINNER_NODE_COUNT) : '86', lbl: 'Topics' },
                { num: '500+', lbl: 'Concepts' },
              ].map(({ num, lbl }) => (
                <div key={lbl} className="text-center">
                  <div className="text-xl font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{num}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Beginner path toggle */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={toggleBeginner}
                className="text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  color: beginnerOnly ? 'var(--bg-surface)' : 'var(--accent)',
                  borderColor: 'var(--accent-dim)',
                  backgroundColor: beginnerOnly ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                }}
              >
                {beginnerOnly ? 'Showing Beginner Path' : 'Show Beginner Path'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-xl mx-auto">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, concepts, resources..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-theme text-sm outline-none transition-colors focus:border-accent bg-input"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mb-6">
            {PHASES.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label.split('—')[1]?.trim()}
              </div>
            ))}
          </div>

          {/* Phases */}
          {filteredPhases.map((phase) => (
            <div key={phase.id} className="mb-6">
              {/* Phase header */}
              <div className="flex items-center gap-3 mb-3 mt-6">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-medium shrink-0 border-[1.5px]"
                  style={{ color: phase.color, borderColor: `${phase.color}30`, backgroundColor: phase.bg }}
                >
                  {phase.num}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}>
                  {phase.label}
                </span>
                {phase.est && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0"
                    style={{ color: 'var(--text-muted)', borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-hover)' }}>
                    ~{phase.est}
                  </span>
                )}
                {phaseCompletion[phase.id]?.mastered && (
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ color: phase.color, backgroundColor: phase.bg }}>
                    Mastered
                  </span>
                )}
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-base)' }} />
              </div>

              {/* Node grid */}
              <div className={`grid gap-2.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {phase.nodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    phase={phase}
                    isDone={done.has(node.id)}
                    isActive={activeId === node.id}
                    onToggleDone={toggleDone}
                    onSelect={setActiveId}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Mastery banner */}
          <div
            className="rounded-xl border p-6 text-center mt-8 mb-6"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)',
            }}
          >
            <h3 className="text-xl font-semibold tracking-tight mb-2">The Trader&apos;s Oath</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              You are not trying to predict the market. You are building a systematic edge,
              protecting your capital, and executing with discipline. Every great trader was
              once a beginner who refused to quit.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="text-center pb-6">
            <p className="text-[10px] leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              Not financial advice. Past performance does not guarantee future results.
              Trading involves substantial risk of loss and is not suitable for every investor.
              Only trade with capital you can afford to lose.
            </p>
          </div>
        </div>

        {/* Detail panel — desktop side panel */}
        {!isMobile && (
          <div
            className={[
              'shrink-0 overflow-hidden relative border-l border-theme transition-[width,min-width] duration-300 ease-out',
              panelOpen ? 'w-[380px] min-w-[380px]' : 'w-0 min-w-0',
            ].join(' ')}
          >
            {panelOpen && (
              <DetailPanel node={activeNode.node} phase={activeNode.phase} onClose={closePanel} />
            )}
          </div>
        )}

        {/* Detail panel — mobile bottom sheet overlay */}
        {isMobile && panelOpen && (
          <div className="fixed inset-0 z-50 flex flex-col">
            <div className="flex-1" onClick={closePanel} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
            <div
              className="relative max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-theme pb-safe"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1 sticky top-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="w-8 h-1 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }} />
              </div>
              <DetailPanel node={activeNode.node} phase={activeNode.phase} onClose={closePanel} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
