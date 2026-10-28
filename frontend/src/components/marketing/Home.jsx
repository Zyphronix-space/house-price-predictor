import { Link } from 'react-router-dom'
import PublicShell from './PublicShell'

const QUICK_PLACES = ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno']

const STEPS = [
  { label: 'Choose a place', desc: 'Type a California city or tap the map. No sign-up, no email.' },
  { label: 'Check the area', desc: "See that neighbourhood's real 1990 census figures in plain language." },
  { label: 'See the estimate', desc: 'Get its typical home value, a likely range, and what moved the number most.' },
]

const FREE = [
  'Estimate any California neighbourhood',
  'Read the real census figures behind it',
  'Try what-if changes to the figures',
  'Compare up to 4 areas side by side (kept on this device)',
  'See how accurate the model is',
]

const ACCOUNT = [
  'A saved history of estimates you can open from any device',
  'A list of properties you can link estimates to',
  'Similar-neighbourhood lookups and the full dataset charts',
]

export default function Home() {
  return (
    <PublicShell>
      <section className="marketing-hero">
        <p className="marketing-hero__eyebrow">California neighbourhoods, 1990 census</p>
        <h1 className="marketing-hero__headline">
          What were homes worth
          <br />
          in a California neighbourhood?
        </h1>
        <p className="marketing-hero__sub">
          Pick a place and HomeValue estimates its typical home value from real census figures, then
          shows you which details pushed the number up or down. Free to use, no account needed.
        </p>
        <div className="marketing-hero__cta">
          <Link to="/predict" className="hv-btn hv-btn-primary marketing-hero__primary">
            Estimate an area
          </Link>
        </div>
        <div className="marketing-quick" aria-label="Start with a city">
          <span className="marketing-quick__label">Or start with</span>
          {QUICK_PLACES.map((name) => (
            <Link key={name} to={`/predict?place=${encodeURIComponent(name)}`} className="marketing-quick__chip">
              {name}
            </Link>
          ))}
        </div>
      </section>

      <section className="marketing-honest" aria-labelledby="home-honest-title">
        <h2 id="home-honest-title" className="marketing-honest__title">Before you start: what this estimate is</h2>
        <div className="marketing-honest__grid">
          <div>
            <p className="marketing-honest__label">It is</p>
            <p>
              A model's estimate of the median home value across a whole neighbourhood, in 1990
              dollars, based on the 1990 US census.
            </p>
          </div>
          <div>
            <p className="marketing-honest__label">It is not</p>
            <p>
              A valuation of a particular house, today's market price, or an appraisal. Don't use it
              to buy, sell, or borrow.
            </p>
          </div>
        </div>
      </section>

      <section className="marketing-steps" aria-label="How it works">
        {STEPS.map((step, i) => (
          <div key={step.label} className="hv-card marketing-step">
            <span className="marketing-step__index">{i + 1}</span>
            <p className="marketing-step__label">{step.label}</p>
            <p className="marketing-step__desc">{step.desc}</p>
          </div>
        ))}
      </section>

      <section className="marketing-account" aria-labelledby="home-account-title">
        <h2 id="home-account-title" className="marketing-account__title">An account is optional</h2>
        <div className="marketing-account__grid">
          <div className="hv-card marketing-account__col">
            <p className="marketing-account__label">Without an account</p>
            <ul>
              {FREE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to="/predict" className="hv-btn hv-btn-primary">
              Start estimating
            </Link>
          </div>
          <div className="hv-card marketing-account__col">
            <p className="marketing-account__label">With a free account, you also get</p>
            <ul>
              {ACCOUNT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to="/signup" className="hv-btn hv-btn-secondary">
              Create a free account
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
