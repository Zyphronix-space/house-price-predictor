import { useEffect, useState } from 'react'
import './LoadingStages.css'

// Purely presentational -- a visual pacing of the request lifecycle, not a
// readout of real backend telemetry (the backend does all of this in one
// /predict call). Advances on a timer regardless of when the real response
// arrives, then the parent swaps this out once the response is in.
const STAGES = ['Scaling features', 'Running model', 'Calculating estimate', 'Result ready']

export default function LoadingStages() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= STAGES.length - 1) return
    const t = setTimeout(() => setActiveIndex((i) => i + 1), 420)
    return () => clearTimeout(t)
  }, [activeIndex])

  return (
    <div className="loading-stages" role="status" aria-live="polite">
      <p className="loading-stages__headline">Valuing property…</p>
      <ul className="loading-stages__list">
        {STAGES.map((stage, i) => (
          <li key={stage} className={i <= activeIndex ? 'is-active' : ''}>
            <span className="loading-stages__dot" aria-hidden="true" />
            {stage}
          </li>
        ))}
      </ul>
    </div>
  )
}
