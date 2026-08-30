import './Home.css'

export default function Home({ setView }) {
  return (
    <section className="hv-hero">
      <p className="hv-label hv-hero__eyebrow">Home Value</p>
      <h1 className="hv-hero__headline">
        Estimate the value
        <br />
        of a property.
      </h1>
      <p className="hv-hero__tagline">Know the value of your property.</p>

      <button type="button" className="hv-btn hv-btn-primary hv-hero__cta" onClick={() => setView('valuate')}>
        Start Valuation
      </button>

      <p className="hv-hero__footnote">
        Model powered · California Housing Dataset · Machine Learning
      </p>
    </section>
  )
}
