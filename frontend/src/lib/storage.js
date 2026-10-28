const COMPARISON_KEY = 'hv:comparison'
const THEME_KEY = 'hv:theme'
const LAST_ESTIMATE_KEY = 'hv:last-estimate'
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

const sameFeatures = (a, b) => Object.keys(a).every((k) => Number(a[k]) === Number(b?.[k]))

export function isInComparison(features) {
  return getComparison().some((e) => sameFeatures(features, e.features))
}

export function addToComparison({ features, predictedPriceUsd, label }) {
  const current = getComparison()
  if (current.some((e) => sameFeatures(features, e.features))) {
    return { ok: false, error: 'This area is already in your comparison.' }
  }
  if (current.length >= MAX_COMPARISON) {
    return { ok: false, error: `You can compare up to ${MAX_COMPARISON} areas at a time. Remove one first.` }
  }
  const entry = { id: makeId(), features, predictedPriceUsd, label: label || null }
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

// --- Last estimate (this tab only) ------------------------------------
// The most recent /predict result, kept in sessionStorage so it survives
// a detour through sign-in or sign-up and is gone when the tab closes.
// Only model inputs, the area label and the result: nothing personal.

export function getLastEstimate() {
  try {
    const raw = window.sessionStorage.getItem(LAST_ESTIMATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setLastEstimate(estimate) {
  try {
    if (estimate) window.sessionStorage.setItem(LAST_ESTIMATE_KEY, JSON.stringify(estimate))
    else window.sessionStorage.removeItem(LAST_ESTIMATE_KEY)
  } catch {
    // ignore -- the estimate just won't be restored after sign-in
  }
}

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
