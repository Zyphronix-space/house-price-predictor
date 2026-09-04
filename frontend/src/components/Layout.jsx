import { useState } from 'react'
import SystemStatus from './SystemStatus'
import ToastHost from './ToastHost'
import { useTheme } from '../lib/hooks'
import './Layout.css'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'predict', label: 'Predict' },
  { key: 'properties', label: 'Properties' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'comparables', label: 'Comparable Properties', short: 'Comparables' },
  { key: 'whatif', label: 'What-If Simulator', short: 'What-If' },
  { key: 'investment', label: 'Investment Calculator', short: 'Investment' },
  { key: 'model', label: 'Model Performance', short: 'Model' },
  { key: 'history', label: 'Prediction History', short: 'History' },
]

// Bottom nav (mobile) only has room for a few items readably -- these four
// cover the core loop (see, predict, understand, review); the rest are one
// tap away behind "More".
const CORE_KEYS = ['dashboard', 'predict', 'properties', 'history']
const CORE_TABS = TABS.filter((t) => CORE_KEYS.includes(t.key))
const MORE_TABS = TABS.filter((t) => !CORE_KEYS.includes(t.key))

const THEME_ICON = { system: '◐', light: '☀', dark: '☾' }

export default function Layout({ view, setView, children, user, onLogout }) {
  const { theme, cycleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)

  const go = (key) => {
    setView(key)
    setMoreOpen(false)
  }

  return (
    <div className="hv-app">
      <header className="hv-topnav">
        <button type="button" className="hv-brand" onClick={() => go('dashboard')}>
          Home<span className="hv-brand__accent">Value</span>
        </button>

        <nav className="hv-topnav__links" aria-label="Primary">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`hv-topnav__link ${view === tab.key ? 'is-active' : ''}`}
              aria-current={view === tab.key ? 'page' : undefined}
              onClick={() => go(tab.key)}
            >
              {tab.short ?? tab.label}
            </button>
          ))}
        </nav>

        <div className="hv-topnav__meta">
          <SystemStatus compact />
          <button
            type="button"
            className="hv-theme-toggle"
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
          >
            {THEME_ICON[theme]}
          </button>
          {user && (
            <button type="button" className="hv-btn hv-btn-ghost hv-logout-btn" onClick={onLogout} title={user.email}>
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="hv-main">{children}</main>
      <ToastHost />

      {moreOpen && (
        <div className="hv-more-sheet" role="dialog" aria-label="More sections">
          <button type="button" className="hv-more-sheet__backdrop" aria-label="Close" onClick={() => setMoreOpen(false)} />
          <div className="hv-more-sheet__panel">
            {MORE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`hv-more-sheet__item ${view === tab.key ? 'is-active' : ''}`}
                onClick={() => go(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="hv-bottomnav" aria-label="Primary">
        {CORE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`hv-bottomnav__link ${view === tab.key ? 'is-active' : ''}`}
            aria-current={view === tab.key ? 'page' : undefined}
            onClick={() => go(tab.key)}
          >
            {tab.short ?? tab.label}
          </button>
        ))}
        <button
          type="button"
          className={`hv-bottomnav__link ${MORE_TABS.some((t) => t.key === view) ? 'is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
        >
          More
        </button>
      </nav>
    </div>
  )
}
