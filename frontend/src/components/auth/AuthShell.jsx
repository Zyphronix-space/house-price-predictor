import { Link } from 'react-router-dom'
import './Auth.css'

// Shared split-screen frame for every auth page (login/signup/forgot/reset).
// Left: brand + an illustrative preview (clearly a static example, not a
// live figure). Right: whatever form the page passes as children.
export default function AuthShell({ title, tagline, children }) {
  return (
    <div className="hv-app">
      <div className="auth-page">
        <div className="auth-page__brand">
          <p className="auth-page__brand-eyebrow">HomeValue</p>
          <h1 className="auth-page__brand-headline">Understand what a property could be worth.</h1>
          <p className="auth-page__brand-copy">
            Machine-learning price estimates with transparent, explainable reasoning behind every
            number, built on one real trained model, not a black box.
          </p>
          <ul className="auth-page__brand-points">
            <li>Instant ML-based valuations</li>
            <li>Transparent, feature-level prediction explanations</li>
            <li>Comparables, what-if scenarios &amp; investment analysis</li>
          </ul>

          <div className="hv-glass auth-preview" aria-hidden="true">
            <p className="hv-label">Example prediction</p>
            <p className="auth-preview__value">$412,300</p>
            <div className="auth-preview__bars">
              <span style={{ height: '38%' }} />
              <span style={{ height: '62%' }} />
              <span style={{ height: '48%' }} />
              <span style={{ height: '84%' }} />
              <span style={{ height: '70%' }} />
              <span style={{ height: '95%' }} />
            </div>
            <p className="auth-preview__caption">Illustrative preview: not live data</p>
          </div>
        </div>

        <div className="hv-card auth-page__card">
          <Link to="/" className="auth-page__brand-link">
            <span className="hv-brand__mark" aria-hidden="true">HV</span>
            Home<span className="hv-brand__accent">Value</span>
          </Link>
          <h1 className="auth-page__headline">{title}</h1>
          {tagline && <p className="auth-page__tagline">{tagline}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
