// Real, working display/notification preferences (Settings > Appearance /
// Notifications). Each one actually changes rendering or behavior -- see
// theme.css for the data-glass/data-motion/data-density selectors, and
// toast.js's showToast() for the notification toggles.

const KEYS = {
  motion: 'hv:pref:motion', // 'auto' | 'reduced'
  density: 'hv:pref:density', // 'comfortable' | 'compact'
  toastSuccess: 'hv:pref:toast-success', // '1' | '0'
  toastError: 'hv:pref:toast-error', // '1' | '0'
}

function read(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore -- storage unavailable
  }
}

export function getPreferences() {
  return {
    motion: read(KEYS.motion, 'auto'),
    density: read(KEYS.density, 'comfortable'),
    toastSuccess: read(KEYS.toastSuccess, '1') === '1',
    toastError: read(KEYS.toastError, '1') === '1',
  }
}

export function applyPreferencesToDocument(prefs = getPreferences()) {
  const root = document.documentElement
  root.setAttribute('data-density', prefs.density)
  if (prefs.motion === 'reduced') root.setAttribute('data-motion', 'reduced')
  else root.removeAttribute('data-motion')
}

export function setMotionPreference(value) {
  write(KEYS.motion, value)
  applyPreferencesToDocument(getPreferences())
}

export function setDensity(value) {
  write(KEYS.density, value)
  applyPreferencesToDocument(getPreferences())
}

export function setToastSuccessEnabled(enabled) {
  write(KEYS.toastSuccess, enabled ? '1' : '0')
}

export function setToastErrorEnabled(enabled) {
  write(KEYS.toastError, enabled ? '1' : '0')
}
