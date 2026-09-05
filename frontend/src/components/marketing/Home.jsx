import { Link } from 'react-router-dom'
import PublicShell from './PublicShell'

const STEPS = [
  { label: 'Predict', desc: 'Enter property features and get an instant ML-estimated value.' },
  { label: 'Understand', desc: 'See exactly which features pushed the price up or down.' },
  { label: 'Compare', desc: 'Line up saved properties side by side.' },
  { label: 'Simulate', desc: 'Change an input and see the scenario recalculated live.' },
  { label: 'Analyze', desc: 'Explore distributions, correlations, and model performance.' },
  { label: 'Decide', desc: 'Run the investment numbers before you commit.' },
]

const FACTS = [
  { label: 'Dataset', value: 'California Housing', detail: '20,640 real census block-group records' },
  { label: 'Model inputs', value: '8 real features', detail: 'Income, age, rooms, population, location & more' },
  { label: 'Explainability', value: 'Feature-level', detail: 'Every prediction shows what drove it, not just a number' },
  { label: 'Not a black box', value: 'Transparent by design', detail: 'The same trained model, the same math, every time' },
]

export default function Home() {
  return (
    <PublicShell>
      <section className="marketing-hero">
        <p className="marketing-hero__eyebrow">AI-Powered Intelligence</p>
        <h1 className="marketing-hero__headline">
          Turn property data into
          <br />
          clear, explainable decisions.
        </h1>
        <p className="marketing-hero__sub">
          Predict a property's value with a real trained machine-learning model, understand exactly
          why, compare scenarios, and run the investment numbers — all in one place.
        </p>
        <div className="marketing-hero__cta">
          <Link to="/signup" className="hv-btn hv-btn-primary">
            Get started free
          </Link>
          <Link to="/features" className="hv-btn hv-btn-secondary">
            See features
          </Link>
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

      <section className="marketing-facts" aria-label="Model facts">
        {FACTS.map((fact) => (
          <div key={fact.label} className="hv-glass marketing-fact">
            <p className="hv-label">{fact.label}</p>
            <p className="marketing-fact__value">{fact.value}</p>
            <p className="marketing-fact__detail">{fact.detail}</p>
          </div>
        ))}
      </section>

      <section className="hv-glass marketing-cta">
        <h2 className="marketing-cta__headline">Ready to see what your data says?</h2>
        <p className="marketing-cta__sub">Create a free account and run your first valuation in under a minute.</p>
        <Link to="/signup" className="hv-btn hv-btn-primary">
          Create your account
        </Link>
      </section>
    </PublicShell>
  )
}
