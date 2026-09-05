import PublicShell from './PublicShell'

export default function About() {
  return (
    <PublicShell>
      <section className="marketing-hero marketing-hero--compact">
        <p className="marketing-hero__eyebrow">About</p>
        <h1 className="marketing-hero__headline">Built to be transparent, not just accurate.</h1>
        <p className="marketing-hero__sub">
          HomeValue is a real, working machine-learning application — every number on it comes from
          an actual model, and every claim below is something you can verify in the app itself.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">The dataset</p>
        <p className="marketing-about-copy">
          The model is trained on the public California Housing dataset — 20,640 census
          block-group records, each describing a neighborhood-sized cluster of houses rather than a
          single home. Its 8 features are median income, house age, average rooms, average
          bedrooms, population, average occupancy, latitude, and longitude. Inputs like square
          footage or bathroom count aren't part of this dataset, so the app doesn't ask for them —
          adding fields the model was never trained on would make the prediction meaningless.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">The model</p>
        <p className="marketing-about-copy">
          Several regression models are trained and cross-validated against the same held-out test
          set (see Model Insights after signing in for the real metrics); the best performer is
          served in production. Explanations use a tree-path feature-contribution method (the
          Saabas method) — a mathematically exact decomposition of each individual prediction, not
          an approximation. It is deliberately labeled that way rather than as "SHAP," since this
          project doesn't run the `shap` library in production.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">What this is not</p>
        <p className="marketing-about-copy">
          This is not a licensed property appraisal, and its estimates are not guaranteed or market
          prices. Real-world value depends on factors this dataset doesn't capture — condition,
          renovations, schools, and recent comparable sales among them. Treat every prediction as a
          model-estimated starting point, not a final answer.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Tech stack</p>
        <p className="marketing-about-copy">
          React + Vite frontend, FastAPI + SQLAlchemy backend, scikit-learn model training, JWT
          session auth, and a from-scratch Liquid Glass design system built on CSS custom
          properties.
        </p>
      </section>
    </PublicShell>
  )
}
