import { useState } from 'react'
import { Link } from 'react-router-dom'
import SystemStatus from './SystemStatus'
import ToastHost from './ToastHost'
import NotificationCenter from './NotificationCenter'
import UserMenu from './UserMenu'
import { useTheme } from '../lib/hooks'
import './Layout.css'
import './UserMenu.css'
import './NotificationCenter.css'

// Primary nav stays to four destinations -- the core loop (see, predict,
// manage, review) -- everything else (analysis, comparables, what-if,
// investment, model detail) lives one tap away behind "Insights" so a
// first-time visitor isn't shown nine top-level destinations at once.
const CORE_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'predict', label: 'Predict' },
  { key: 'properties', label: 'Properties' },
  { key: 'history', label: 'History' },
]

const INSIGHT_TABS = [
  { key: 'comparables', label: 'Comparable properties', desc: 'Nearest real matches to your last prediction' },
  { key: 'whatif', label: 'What-if simulator', desc: 'Change one input and see the new estimate' },
  { key: 'analysis', label: 'Market analysis', desc: 'Distributions, correlations, model fit' },
  { key: 'investment', label: 'Investment calculator', desc: 'Mortgage, cash flow, ROI' },
  { key: 'model', label: 'Model performance', desc: 'Comparison, cross-validation, errors' },
]

const THEME_ICON = { system: '◐', light: '☀', dark: '☾' }

export default function Layout({ view, setView, children, user, onLogout }) {
  const { theme, cycleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const isInsightView = INSIGHT_TABS.some((t) => t.key === view)

  const go = (key) => {
    setView(key)
    setMoreOpen(false)
  }

  return (
    <div className="hv-app">
      <header className="hv-topnav-wrap">
        <div className="hv-topnav">
          {user ? (
            <button type="button" className="hv-brand" onClick={() => go('dashboard')}>
              <span className="hv-brand__mark" aria-hidden="true">HV</span>
              <span className="hv-brand__word">
                Home<span className="hv-brand__accent">Value</span>
              </span>
            </button>
          ) : (
            <Link to="/" className="hv-brand">
              <span className="hv-brand__mark" aria-hidden="true">HV</span>
              <span className="hv-brand__word">
                Home<span className="hv-brand__accent">Value</span>
              </span>
            </Link>
          )}

          {user && (
            <nav className="hv-topnav__links" aria-label="Primary">
              {CORE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`hv-topnav__link ${view === tab.key ? 'is-active' : ''}`}
                  aria-current={view === tab.key ? 'page' : undefined}
                  onClick={() => go(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
              <button
                type="button"
                className={`hv-topnav__link ${isInsightView ? 'is-active' : ''}`}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((o) => !o)}
              >
                Insights
              </button>
            </nav>
          )}

          <div className="hv-topnav__meta">
            {user && <SystemStatus compact />}
            <button
              type="button"
              className="hv-theme-toggle"
              onClick={cycleTheme}
              aria-label={`Theme: ${theme}. Click to change.`}
              title={`Theme: ${theme}`}
            >
              {THEME_ICON[theme]}
            </button>
            {user ? (
              <>
                <NotificationCenter />
                <UserMenu user={user} onLogout={onLogout} />
              </>
            ) : (
              <>
                <Link to="/login" className="hv-btn hv-btn-ghost">
                  Sign in
                </Link>
                <Link to="/signup" className="hv-btn hv-btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="hv-main">{children}</main>
      <ToastHost />

      {user && moreOpen && (
        <div className="hv-more-sheet" role="dialog" aria-label="Insights">
          <button type="button" className="hv-more-sheet__backdrop" aria-label="Close" onClick={() => setMoreOpen(false)} />
          <div className="hv-more-sheet__panel">
            <p className="hv-more-sheet__heading">Insights</p>
            {INSIGHT_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`hv-more-sheet__item ${view === tab.key ? 'is-active' : ''}`}
                onClick={() => go(tab.key)}
              >
                <span className="hv-more-sheet__item-label">{tab.label}</span>
                <span className="hv-more-sheet__item-desc">{tab.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {user && (
        <nav className="hv-bottomnav" aria-label="Primary">
          {CORE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`hv-bottomnav__link ${view === tab.key ? 'is-active' : ''}`}
              aria-current={view === tab.key ? 'page' : undefined}
              onClick={() => go(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            className={`hv-bottomnav__link ${isInsightView ? 'is-active' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((o) => !o)}
          >
            Insights
          </button>
        </nav>
      )}
    </div>
  )
}
