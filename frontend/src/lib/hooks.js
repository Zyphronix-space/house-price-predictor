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

// Just light/dark -- no separate "system" option to pick. The OS
// preference decides automatically for anyone who hasn't made an explicit
// choice yet (initial state below, plus a live listener so it keeps
// tracking OS changes right up until the first manual toggle); clicking
// the toggle makes an explicit, persisted choice that then stays sticky
// regardless of OS preference, same as any plain light/dark switch.
const THEME_ORDER = ['light', 'dark']

function osPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => getStoredTheme() || (osPrefersDark() ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // No stored choice yet: keep following the OS preference live.
  useEffect(() => {
    if (getStoredTheme() || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setThemeState(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = (next) => {
    setThemeState(next)
    setStoredTheme(next)
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
