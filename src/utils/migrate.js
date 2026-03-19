/**
 * localStorage schema migration utility.
 *
 * Each store that persists to localStorage defines a migrations array.
 * On load, migrateStore() checks the stored version and runs any pending
 * migration steps sequentially (v0 → v1 → v2 → …).
 *
 * Version is tracked in a separate key: `${storageKey}-v`.
 * Data without a version key is treated as v0 (pre-migration).
 */

/**
 * Run pending migrations on a localStorage key.
 *
 * Call this BEFORE the store's load function reads the key — it mutates
 * localStorage in place so the existing load logic works unchanged.
 *
 * @param {string} storageKey  — localStorage key holding the data
 * @param {{ version: number, up: (data: any) => any }[]} migrations
 *   Sorted ascending by version. Each `up` transforms data from (version-1) → version.
 * @param {Storage} [storage=localStorage] — injectable for testing
 */
export function migrateStore(storageKey, migrations, storage) {
  if (storage === undefined) {
    try { storage = localStorage } catch { return }
  }
  if (!migrations.length) return

  const versionKey = storageKey + '-v'
  const targetVersion = migrations[migrations.length - 1].version

  let currentVersion = 0
  try {
    const v = storage.getItem(versionKey)
    if (v !== null) currentVersion = parseInt(v, 10) || 0
  } catch { /* storage unavailable */ }

  if (currentVersion >= targetVersion) return

  // Read existing data
  let raw
  try {
    raw = storage.getItem(storageKey)
  } catch { return }

  // No data yet — just stamp the version for future saves
  if (raw === null) {
    try { storage.setItem(versionKey, String(targetVersion)) } catch { /* noop */ }
    return
  }

  // Parse + migrate
  let data
  try {
    data = JSON.parse(raw)
  } catch { return } // corrupt JSON — let store fall back to defaults

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      try {
        data = migration.up(data)
      } catch {
        return // migration failed — leave data as-is, store handles with validation
      }
    }
  }

  // Write migrated data + version stamp
  try {
    storage.setItem(storageKey, JSON.stringify(data))
    storage.setItem(versionKey, String(targetVersion))
  } catch { /* storage unavailable */ }
}

/**
 * Stamp version keys for all stores after a backup import.
 * Prevents the migration system from re-running no-op v0→v1 on freshly imported data.
 *
 * @param {Storage} [storage=localStorage]
 */
export function stampCurrentVersions(storage) {
  if (storage === undefined) {
    try { storage = localStorage } catch { return }
  }
  const stamps = [
    ['cheechart-presets', 1],
    ['cheechart-journal', 1],
    ['cheechart-annotations', 1],
    // Alert keys are dynamic — stamped individually by the alerts migration
  ]
  for (const [key, version] of stamps) {
    try { storage.setItem(key + '-v', String(version)) } catch { /* noop */ }
  }
}

/**
 * Stamp version for a specific alert key after backup import.
 *
 * @param {string} presetId
 * @param {number} version
 * @param {Storage} [storage=localStorage]
 */
export function stampAlertVersion(presetId, version = 1, storage) {
  if (storage === undefined) {
    try { storage = localStorage } catch { return }
  }
  try {
    storage.setItem(`cheechart-alerts-${presetId}-v`, String(version))
  } catch { /* noop */ }
}
