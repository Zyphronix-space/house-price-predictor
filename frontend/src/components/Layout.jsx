import SystemStatus from './SystemStatus'
import { useTheme } from '../lib/hooks'
import './Layout.css'

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'valuate', label: 'Valuate' },
  { key: 'compare', label: 'Compare' },
  { key: 'history', label: 'History' },
  { key: 'model', label: 'Model' },
]

const THEME_ICON = { system: '◐', light: '☀', dark: '☾' }

export default function Layout({ view, setView, children }) {
  const { theme, cycleTheme } = useTheme()

  return (
    <div className="hv-app">
      <header className="hv-topnav">
        <button type="button" className="hv-brand" onClick={() => setView('home')}>
          Home<span className="hv-brand__accent">Value</span>
        </button>

        <nav className="hv-topnav__links" aria-label="Primary">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`hv-topnav__link ${view === tab.key ? 'is-active' : ''}`}
              aria-current={view === tab.key ? 'page' : undefined}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
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
        </div>
      </header>

      <main className="hv-main">{children}</main>

      <nav className="hv-bottomnav" aria-label="Primary">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`hv-bottomnav__link ${view === tab.key ? 'is-active' : ''}`}
            aria-current={view === tab.key ? 'page' : undefined}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
