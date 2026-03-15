/**
 * Default chart presets — shipped with the app.
 *
 * Each preset defines which indicators are on/off, the default timeframe,
 * and optionally a theme. Symbol is NOT part of a preset (it floats freely).
 *
 * `isDefault: true` means the preset cannot be deleted or renamed by the user.
 */

export const DEFAULT_PRESETS = {
  'full-terminal': {
    id: 'full-terminal',
    name: 'Full Terminal',
    icon: '◈',
    isDefault: true,
    indicators: {
      ema: true,
      vwap: true,
      rvol: true,
      rsi: true,
      macd: true,
      levels: true,
      sr: true,
    },
    timeframe: '5Min',
  },
  'clean': {
    id: 'clean',
    name: 'Clean',
    icon: '◇',
    isDefault: true,
    indicators: {
      ema: false,
      vwap: false,
      rvol: false,
      rsi: false,
      macd: false,
      levels: false,
      sr: false,
    },
    timeframe: '5Min',
  },
  'scalp': {
    id: 'scalp',
    name: 'Scalp',
    icon: '⚡',
    isDefault: true,
    indicators: {
      ema: true,
      vwap: true,
      rvol: false,
      rsi: false,
      macd: false,
      levels: true,
      sr: false,
    },
    timeframe: '5Min',
  },
  'swing': {
    id: 'swing',
    name: 'Swing',
    icon: '◆',
    isDefault: true,
    indicators: {
      ema: true,
      vwap: false,
      rvol: false,
      rsi: true,
      macd: true,
      levels: true,
      sr: true,
    },
    timeframe: '4Hour',
  },
}

export const DEFAULT_PRESET_ID = 'full-terminal'
