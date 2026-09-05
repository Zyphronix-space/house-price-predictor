// Maps the app's page "keys" (used throughout the existing components --
// Dashboard's quicklinks, ValuationFlow's onWhatIf, Layout's nav, etc.) to
// real URL routes. Keeping this as the single translation point meant
// every existing page component could keep calling setView('predict') etc.
// unchanged when the app moved from view-state navigation to react-router.
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const VIEW_PATHS = {
  dashboard: '/dashboard',
  predict: '/predict',
  properties: '/properties',
  analysis: '/market-analytics',
  comparables: '/comparables',
  whatif: '/what-if',
  investment: '/investment',
  model: '/model-insights',
  history: '/history',
  compare: '/compare',
  profile: '/profile',
  settings: '/settings',
}

const PATH_TO_VIEW = Object.fromEntries(Object.entries(VIEW_PATHS).map(([key, path]) => [path, key]))

export function useSetView() {
  const navigate = useNavigate()
  return useCallback((key) => navigate(VIEW_PATHS[key] ?? '/dashboard'), [navigate])
}

export function useCurrentView() {
  const { pathname } = useLocation()
  return PATH_TO_VIEW[pathname] ?? 'dashboard'
}
