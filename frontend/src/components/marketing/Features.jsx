import { Link } from 'react-router-dom'
import PublicShell from './PublicShell'

const FEATURES = [
  {
    title: 'ML-powered valuation',
    desc: 'A real trained model estimates property value from 8 measurable features, no invented inputs like square footage that the model was never trained on.',
  },
  {
    title: 'Explainable predictions',
    desc: '"How this prediction was made" breaks the estimate down by feature contribution, so the number is never a black box.',
  },
  {
    title: 'Comparable properties',
    desc: 'Nearest-neighbor search over the real reference dataset surfaces the closest actual records to your prediction.',
  },
  {
    title: 'What-if simulator',
    desc: 'Change an input and instantly compare the current prediction against the scenario, with the exact difference.',
  },
  {
    title: 'Property comparison',
    desc: 'Save predictions and line several up side by side across every model input and the resulting value.',
  },
  {
    title: 'Investment calculator',
    desc: 'Monthly payment, cash flow, ROI, and break-even from clearly labeled financial assumptions, never presented as ML output.',
  },
  {
    title: 'Prediction history',
    desc: 'Every valuation is saved, searchable, filterable, and exportable, with multi-select comparison.',
  },
  {
    title: 'Model insights',
    desc: 'Real evaluation metrics, cross-validation, error analysis, and feature importance for the model actually serving predictions.',
  },
]

export default function Features() {
  return (
    <PublicShell>
      <section className="marketing-hero marketing-hero--compact">
        <p className="marketing-hero__eyebrow">Features</p>
        <h1 className="marketing-hero__headline">Everything from prediction to decision.</h1>
        <p className="marketing-hero__sub">
          Every feature below is real and running on the same trained model, nothing here is a
          mockup.
        </p>
      </section>

      <section className="marketing-features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="hv-card marketing-feature">
            <p className="marketing-feature__title">{f.title}</p>
            <p className="marketing-feature__desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="hv-glass marketing-cta">
        <h2 className="marketing-cta__headline">See it work on a real property.</h2>
        <p className="marketing-cta__sub">Sign up and run your first prediction in under a minute.</p>
        <Link to="/signup" className="hv-btn hv-btn-primary">
          Get started free
        </Link>
      </section>
    </PublicShell>
  )
}
