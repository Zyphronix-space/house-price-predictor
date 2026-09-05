const COMPARISON_KEY = 'hv:comparison'
const THEME_KEY = 'hv:theme'
const MAX_COMPARISON = 4

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// --- Property comparison -------------------------------------------

export function getComparison() {
  return readJson(COMPARISON_KEY, [])
}

export function addToComparison({ features, predictedPriceUsd }) {
  const current = getComparison()
  if (current.length >= MAX_COMPARISON) {
    return { ok: false, error: `You can compare up to ${MAX_COMPARISON} properties at a time.` }
  }
  const entry = { id: makeId(), features, predictedPriceUsd }
  writeJson(COMPARISON_KEY, [...current, entry])
  return { ok: true, entry }
}

export function removeFromComparison(id) {
  writeJson(COMPARISON_KEY, getComparison().filter((e) => e.id !== id))
}

export function clearComparison() {
  writeJson(COMPARISON_KEY, [])
}

export const MAX_COMPARISON_PROPERTIES = MAX_COMPARISON

// --- Theme preference ------------------------------------------------

export function getStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

export function setStoredTheme(theme) {
  try {
    if (theme) window.localStorage.setItem(THEME_KEY, theme)
    else window.localStorage.removeItem(THEME_KEY)
  } catch {
    // ignore -- theme preference just won't persist
  }
}
