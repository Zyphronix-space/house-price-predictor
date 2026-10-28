import { useState } from 'react'
import { Link } from 'react-router-dom'
import ToastHost from './ToastHost'
import NotificationCenter from './NotificationCenter'
import UserMenu from './UserMenu'
import { SunIcon, MoonIcon, LogoMark } from './icons'
import { useTheme } from '../lib/hooks'
import { VIEW_PATHS } from '../lib/nav'
import './Layout.css'
import './UserMenu.css'
import './NotificationCenter.css'

// Primary nav stays to four destinations -- the core loop (see, predict,
// manage, review) -- everything else (analysis, comparables, what-if,
// investment, model detail) lives one tap away behind "Insights" so a
// first-time visitor isn't shown nine top-level destinations at once.
const CORE_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'predict', label: 'Estimate' },
  { key: 'properties', label: 'Properties' },
  { key: 'history', label: 'History' },
]

// What a guest can use without an account. Account-only pages are still
// reachable (footer, links) and explain themselves via AccountGate.
const GUEST_TABS = [
  { key: 'predict', label: 'Estimate' },
  { key: 'compare', label: 'Compare' },
  { key: 'whatif', label: 'What-if' },
  { key: 'model', label: 'The model' },
]

const INSIGHT_TABS = [
  { key: 'comparables', label: 'Comparable properties', desc: 'Nearest real matches to your last prediction' },
  { key: 'whatif', label: 'What-if simulator', desc: 'Change one input and see the new estimate' },
  { key: 'analysis', label: 'Dataset analysis', desc: 'Distributions, correlations, model fit' },
  { key: 'investment', label: 'Investment calculator', desc: 'Mortgage, cash flow, ROI' },
  { key: 'model', label: 'Model performance', desc: 'Comparison, cross-validation, errors' },
]

const THEME_ICON = { light: SunIcon, dark: MoonIcon }

export default function Layout({ view, setView, children, user, onLogout }) {
  const { theme, cycleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const isInsightView = INSIGHT_TABS.some((t) => t.key === view)
  // Fall back to SunIcon for a stale/invalid stored theme value instead
  // of crashing the whole layout (THEME_ICON[theme] undefined).
  const ThemeIcon = THEME_ICON[theme] || SunIcon

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
              <span className="hv-brand__mark" aria-hidden="true"><LogoMark width={20} height={20} /></span>
              <span className="hv-brand__word">
                Home<span className="hv-brand__accent">Value</span>
              </span>
            </button>
          ) : (
            <Link to="/" className="hv-brand">
              <span className="hv-brand__mark" aria-hidden="true"><LogoMark width={20} height={20} /></span>
              <span className="hv-brand__word">
                Home<span className="hv-brand__accent">Value</span>
              </span>
            </Link>
          )}

          {!user && (
            <nav className="hv-topnav__links" aria-label="Primary">
              {GUEST_TABS.map((tab) => (
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
            </nav>
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
            <button
              type="button"
              className="hv-theme-toggle"
              onClick={cycleTheme}
              aria-label={`Theme: ${theme}. Click to change.`}
              title={`Theme: ${theme}`}
            >
              <ThemeIcon />
            </button>
            {user ? (
              <>
                <NotificationCenter />
                <UserMenu user={user} onLogout={onLogout} />
              </>
            ) : (
              <>
                <Link to="/login" state={{ from: VIEW_PATHS[view] }} className="hv-btn hv-btn-ghost">
                  Sign in
                </Link>
                <Link to="/signup" state={{ from: VIEW_PATHS[view] }} className="hv-btn hv-btn-secondary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="hv-main">{children}</main>

      <footer className="hv-app-footer">
        <div className="hv-app-footer__inner">
        <div className="hv-app-footer__grid">
          <div className="hv-app-footer__about">
            <div className="hv-app-footer__brand">
              <span className="hv-brand__mark" aria-hidden="true"><LogoMark width={20} height={20} /></span>
              <div>
                <span className="hv-app-footer__brand-name">
                  Home<span className="hv-brand__accent">Value</span>
                </span>
                <span className="hv-app-footer__eyebrow">California housing valuation model</span>
              </div>
            </div>
            <p className="hv-app-footer__tagline">
              Model estimates for California census block groups, with the inputs and
              contributions behind every number.
            </p>
          </div>

          <div className="hv-app-footer__col">
            <p className="hv-app-footer__heading">Explore</p>
            <Link to="/predict">Estimate an area</Link>
            <Link to="/compare">Compare areas</Link>
            <Link to="/what-if">What-if simulator</Link>
            <Link to="/model-insights">How the model works</Link>
            <Link to="/investment">Investment calculator</Link>
          </div>

          <div className="hv-app-footer__col">
            <p className="hv-app-footer__heading">Account</p>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/properties">Properties</Link>
                <Link to="/history">History</Link>
                <Link to="/settings">Settings</Link>
              </>
            ) : (
              <>
                <Link to="/history">Saved estimates</Link>
                <Link to="/properties">Saved properties</Link>
                <Link to="/login">Sign in</Link>
                <Link to="/signup">Create a free account</Link>
              </>
            )}
          </div>

          <div className="hv-app-footer__col">
            <p className="hv-app-footer__heading">Legal &amp; Support</p>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms and Conditions</Link>
            <a href="https://github.com/Zyphronix-space/house-price-predictor" target="_blank" rel="noopener">
              Source on GitHub
            </a>
            <a href="mailto:stephanwasalathanthrige@gmail.com">Contact</a>
          </div>
        </div>

        <div className="hv-app-footer__bottom">
          <p className="hv-app-footer__copy">
            &copy; {new Date().getFullYear()} HomeValue. Not a licensed appraisal service.
          </p>
        </div>
        </div>
      </footer>

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

      {!user && (
        <nav className="hv-bottomnav" aria-label="Primary">
          {GUEST_TABS.map((tab) => (
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
        </nav>
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
