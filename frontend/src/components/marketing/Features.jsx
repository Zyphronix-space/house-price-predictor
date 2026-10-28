import { Link } from 'react-router-dom'
import PublicShell from './PublicShell'

// `free` marks what works without an account. Keep this in step with the
// routes in App.jsx: the public ones are /predict, /compare, /what-if and
// /model-insights.
const FEATURES = [
  {
    title: 'Neighbourhood estimates',
    free: true,
    desc: "Choose a California city or a point on the map and get the model's estimate of that neighbourhood's typical 1990 home value, with a likely range.",
  },
  {
    title: 'Plain-language explanation',
    free: true,
    desc: 'See the real census figures behind every estimate and which of them pushed the number up or down most.',
  },
  {
    title: 'What-if simulator',
    free: true,
    desc: 'Change one figure, such as household income or home age, and see exactly how the estimate moves.',
  },
  {
    title: 'Compare areas',
    free: true,
    desc: 'Line up to 4 areas side by side. The list is kept in your browser on this device, not on our servers.',
  },
  {
    title: 'How the model works',
    free: true,
    desc: "The served model's test accuracy, how it compares with other models, and the dataset it learned from. The detailed error table needs an account.",
  },
  {
    title: 'Saved estimate history',
    free: false,
    desc: 'Save estimates to your account, open them from any device, compare them, and export them as CSV or JSON.',
  },
  {
    title: 'Saved properties',
    free: false,
    desc: 'Keep a list of places you care about and link your estimates to them.',
  },
  {
    title: 'Similar neighbourhoods',
    free: false,
    desc: 'Find the real 1990 census neighbourhoods closest to one of your saved estimates.',
  },
  {
    title: 'Dataset analysis',
    free: false,
    desc: 'Distributions, correlations and actual-versus-predicted charts over samples of the census records.',
  },
  {
    title: 'Investment calculator',
    free: false,
    desc: "Mortgage and cash-flow arithmetic over assumptions you enter. It isn't model output, and the estimates it starts from are 1990 values.",
  },
]

export default function Features() {
  return (
    <PublicShell>
      <section className="marketing-hero marketing-hero--compact">
        <p className="marketing-hero__eyebrow">Features</p>
        <h1 className="marketing-hero__headline">Most of HomeValue works without an account.</h1>
        <p className="marketing-hero__sub">
          Everything here runs on the same model, trained on 1990 California census data. It
          estimates typical neighbourhood values from that time, not the price of a particular home
          today.
        </p>
      </section>

      <section className="marketing-features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="hv-card marketing-feature">
            <span className={`marketing-feature__access${f.free ? ' is-free' : ''}`}>
              {f.free ? 'No account needed' : 'Free account'}
            </span>
            <p className="marketing-feature__title">{f.title}</p>
            <p className="marketing-feature__desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="hv-glass marketing-cta">
        <h2 className="marketing-cta__headline">Try it on a neighbourhood you know.</h2>
        <p className="marketing-cta__sub">No sign-up. Pick a place and see the estimate in a few seconds.</p>
        <Link to="/predict" className="hv-btn hv-btn-primary">
          Estimate an area
        </Link>
      </section>
    </PublicShell>
  )
}
