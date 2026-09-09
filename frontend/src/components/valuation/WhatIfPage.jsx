import WhatIfSimulator from './WhatIfSimulator'
import ErrorState from '../ErrorState'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import './WhatIfPage.css'

// Standalone nav destination for the simulator, driven by the most recent
// saved prediction. The same WhatIfSimulator also appears inline right
// after a fresh prediction in ValuationFlow -- this just gives it a
// top-level home too, per the platform's IA.
export default function WhatIfPage({ setView }) {
  const { data, error, loading } = useAsync(() => api.predictions.list(), [])
  const latest = data?.predictions?.[0]

  if (loading) {
    return <div className="hv-card hv-skeleton whatif-page whatif-page--loading" aria-hidden="true" />
  }

  if (error) {
    return <ErrorState message={error instanceof ApiError ? error.message : 'Could not load your prediction history.'} />
  }

  if (!latest) {
    return (
      <section className="hv-card whatif-page whatif-page--empty">
        <span className="hv-empty-icon" aria-hidden="true">+</span>
        <p className="hv-label">What-If Simulator</p>
        <p className="whatif-page__empty-copy">
          Run a valuation first, the simulator explores scenarios starting from your most
          recent prediction's inputs.
        </p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Start a Valuation
        </button>
      </section>
    )
  }

  return (
    <section className="whatif-page">
      <p className="hv-label whatif-page__title">What-If Simulator</p>
      <p className="whatif-page__note">Starting from your most recent prediction's inputs.</p>
      <WhatIfSimulator
        baseFeatures={latest.features}
        baseValue={latest.predicted_price_usd}
        onClose={() => setView('dashboard')}
      />
    </section>
  )
}
