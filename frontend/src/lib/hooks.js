import { useEffect, useRef, useState } from 'react'
import { getStoredTheme, setStoredTheme } from './storage'

// Runs an async fetcher (e.g. api.datasetStats) once on mount and exposes
// its lifecycle. Guards against setting state after unmount.
export function useAsync(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setState({ data: null, error: null, loading: true })
    fetcher()
      .then((data) => {
        if (mounted.current) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (mounted.current) setState({ data: null, error, loading: false })
      })
    return () => {
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

// Polls a fetcher on an interval, keeping the last-known-good value on
// screen while a fresh check is in flight.
export function usePolling(fetcher, intervalMs) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  useEffect(() => {
    let mounted = true
    let timer

    const tick = () => {
      fetcher()
        .then((data) => {
          if (mounted) setState({ data, error: null, loading: false })
        })
        .catch((error) => {
          if (mounted) setState({ data: null, error, loading: false })
        })
        .finally(() => {
          if (mounted) timer = setTimeout(tick, intervalMs)
        })
    }
    tick()

    return () => {
      mounted = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs])

  return state
}

// Cycles 'system' -> 'light' -> 'dark' -> 'system'. 'system' means no
// explicit preference is stored, so index.css's prefers-color-scheme media
// query decides. An explicit choice is stamped as data-theme on <html> and
// persisted.
const THEME_ORDER = ['system', 'light', 'dark']

export function useTheme() {
  const [theme, setThemeState] = useState(() => getStoredTheme() || 'system')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (next) => {
    setThemeState(next)
    setStoredTheme(next === 'system' ? null : next)
  }

  const cycleTheme = () => {
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length])
  }

  return { theme, setTheme, cycleTheme }
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
