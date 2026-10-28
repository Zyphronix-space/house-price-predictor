import WhatIfSimulator from './WhatIfSimulator'
import ErrorState from '../ErrorState'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/authContext'
import { getLastEstimate } from '../../lib/storage'
import './WhatIfPage.css'

// Standalone nav destination for the simulator. Signed-in users start from
// their most recent saved prediction; guests (and users with nothing saved
// yet) start from the last estimate made in this tab. The same
// WhatIfSimulator also appears inline right after a fresh prediction in
// ValuationFlow.
export default function WhatIfPage({ setView }) {
  const { user } = useAuth()
  const { data, error, loading } = useAsync(() => (user ? api.predictions.list() : Promise.resolve(null)), [user])
  const saved = data?.predictions?.[0]
  const local = getLastEstimate()
  const base = saved
    ? { features: saved.features, value: saved.predicted_price_usd, note: "Starting from your most recent saved estimate's figures." }
    : local
      ? {
          features: local.resultInputs,
          value: local.result.predicted_price_usd,
          note: `Starting from your last estimate${local.area?.shortLabel ? ` (${local.area.shortLabel})` : ''}.`,
        }
      : null

  if (loading) {
    return <div className="hv-card hv-skeleton whatif-page whatif-page--loading" aria-hidden="true" />
  }

  if (error && !local) {
    return <ErrorState message={error instanceof ApiError ? error.message : 'Could not load your prediction history.'} />
  }

  if (!base) {
    return (
      <section className="hv-card whatif-page whatif-page--empty">
        <span className="hv-empty-icon" aria-hidden="true">+</span>
        <h1 className="whatif-page__heading">What-if simulator</h1>
        <p className="whatif-page__empty-copy">
          Estimate an area first. The simulator then lets you change one figure at a time and see
          how the estimate moves. No account needed.
        </p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Estimate an area
        </button>
      </section>
    )
  }

  return (
    <section className="whatif-page">
      <h1 className="whatif-page__heading whatif-page__title">What-if simulator</h1>
      <p className="whatif-page__note">{base.note}</p>
      <WhatIfSimulator
        baseFeatures={base.features}
        baseValue={base.value}
        onClose={() => setView(user ? 'dashboard' : 'predict')}
      />
    </section>
  )
}
