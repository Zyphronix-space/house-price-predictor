import { Link } from 'react-router-dom'
import PublicShell from './PublicShell'

const STEPS = [
  { label: 'Property', desc: 'Enter what you know about a property, or describe it in your own words.' },
  { label: 'Prediction', desc: 'A trained machine-learning model returns an estimated value.' },
  { label: 'Explanation', desc: 'See exactly which features pushed that number up or down.' },
  { label: 'Comparables', desc: 'Find the real dataset records closest to your inputs.' },
  { label: 'What-if', desc: 'Change one input and see how the estimate moves.' },
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
        <p className="marketing-hero__eyebrow">California housing model</p>
        <h1 className="marketing-hero__headline">
          Know what a property is worth,
          <br />
          and why.
        </h1>
        <p className="marketing-hero__sub">
          HomeValue predicts a property's value with a real trained machine-learning model,
          shows you exactly which features drove that number, and lets you compare it against
          similar properties and test what-if scenarios.
        </p>
        <div className="marketing-hero__cta">
          <Link to="/predict" className="hv-btn hv-btn-primary">
            Try a prediction, no account needed
          </Link>
          <Link to="/signup" className="hv-btn hv-btn-secondary">
            Create a free account
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
