/**
 * Accent color presets — per-theme palette for user customization.
 *
 * Each preset defines 5 CSS custom property values:
 *   --accent, --accent-dim, --btn-primary, --btn-primary-hover, --focus-ring
 *
 * Shared between:
 *   - useChartStore.setAccentColor() — applies to DOM
 *   - SettingsModal — renders color picker dots
 *
 * The first entry in each theme array is the default accent.
 */

export const ACCENT_PRESETS = {
  dark: [
    { id: 'blue',   color: '#60a5fa', dim: '#172554', btn: '#2563eb', btnHover: '#3b82f6', ring: '#3b82f6' },
    { id: 'purple', color: '#a78bfa', dim: '#1e1048', btn: '#7c3aed', btnHover: '#8b5cf6', ring: '#8b5cf6' },
    { id: 'teal',   color: '#2dd4bf', dim: '#042f2e', btn: '#0d9488', btnHover: '#14b8a6', ring: '#14b8a6' },
    { id: 'rose',   color: '#fb7185', dim: '#4c0519', btn: '#e11d48', btnHover: '#f43f5e', ring: '#f43f5e' },
    { id: 'amber',  color: '#fbbf24', dim: '#451a03', btn: '#d97706', btnHover: '#f59e0b', ring: '#f59e0b' },
    { id: 'green',  color: '#4ade80', dim: '#052e16', btn: '#16a34a', btnHover: '#22c55e', ring: '#22c55e' },
  ],
  terminal: [
    { id: 'green',  color: '#50d050', dim: '#0a280a', btn: '#1a6b1a', btnHover: '#228b22', ring: '#50d050' },
    { id: 'cyan',   color: '#40d8d8', dim: '#082828', btn: '#107070', btnHover: '#18a0a0', ring: '#40d8d8' },
    { id: 'amber',  color: '#d0b040', dim: '#282008', btn: '#887018', btnHover: '#a89028', ring: '#d0b040' },
    { id: 'violet', color: '#a080d0', dim: '#180828', btn: '#604080', btnHover: '#7850a0', ring: '#a080d0' },
    { id: 'rose',   color: '#d07080', dim: '#280810', btn: '#903848', btnHover: '#b04858', ring: '#d07080' },
    { id: 'blue',   color: '#6090d0', dim: '#081028', btn: '#305088', btnHover: '#4068a8', ring: '#6090d0' },
  ],
  lumpio: [
    { id: 'ember',  color: '#C85818', dim: '#481808', btn: '#a04010', btnHover: '#C85818', ring: '#C85818' },
    { id: 'gold',   color: '#d0a030', dim: '#382808', btn: '#a07818', btnHover: '#c89828', ring: '#d0a030' },
    { id: 'sage',   color: '#80b868', dim: '#182810', btn: '#508038', btnHover: '#68a050', ring: '#80b868' },
    { id: 'clay',   color: '#c07868', dim: '#381810', btn: '#905038', btnHover: '#b06850', ring: '#c07868' },
    { id: 'copper', color: '#d89060', dim: '#382010', btn: '#a06830', btnHover: '#c88048', ring: '#d89060' },
    { id: 'plum',   color: '#a87898', dim: '#281020', btn: '#805068', btnHover: '#986880', ring: '#a87898' },
  ],
}

/**
 * Build a lookup map from the ACCENT_PRESETS arrays for fast access by theme+id.
 * Returns { dark: { blue: {...}, purple: {...} }, terminal: {...}, lumpio: {...} }
 */
export function buildAccentLookup() {
  const lookup = {}
  for (const [theme, presets] of Object.entries(ACCENT_PRESETS)) {
    lookup[theme] = {}
    for (const p of presets) {
      lookup[theme][p.id] = { accent: p.color, dim: p.dim, btn: p.btn, btnHover: p.btnHover, ring: p.ring }
    }
  }
  return lookup
}

/** Pre-built lookup for store usage */
export const ACCENT_LOOKUP = buildAccentLookup()
