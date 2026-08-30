import './Limitations.css'

export default function Limitations() {
  return (
    <details className="hv-card limitations">
      <summary className="limitations__summary">
        <span className="hv-label">About this estimate</span>
        <span className="limitations__chevron" aria-hidden="true">⌄</span>
      </summary>
      <ul className="limitations__list">
        <li>The model is trained on the public California Housing dataset, not live listings.</li>
        <li>Each record describes a census block group (a neighborhood-sized cluster of houses), not an individual property.</li>
        <li>This is not a licensed property appraisal, and the result is a model-estimated value, not a guaranteed or market price.</li>
        <li>The model may perform poorly for inputs far outside the range of its training data.</li>
        <li>Real-world property values depend on factors not represented in these eight features, such as condition, renovations, schools, or recent comparable sales.</li>
      </ul>
    </details>
  )
}
