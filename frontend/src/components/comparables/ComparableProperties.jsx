import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import ErrorState from '../ErrorState'
import './ComparableProperties.css'

const ROWS = [
  { key: 'MedInc', title: 'Income', format: (f) => `$${Math.round(f.MedInc * 10_000).toLocaleString()}` },
  { key: 'HouseAge', title: 'House age', format: (f) => `${f.HouseAge} yrs` },
  { key: 'AveRooms', title: 'Rooms', format: (f) => Number(f.AveRooms).toFixed(2) },
  { key: 'AveBedrms', title: 'Bedrooms', format: (f) => Number(f.AveBedrms).toFixed(2) },
  { key: 'Population', title: 'Population', format: (f) => Number(f.Population).toLocaleString() },
  { key: 'AveOccup', title: 'Occupancy', format: (f) => Number(f.AveOccup).toFixed(2) },
  { key: 'location', title: 'Location', format: (f) => `${Number(f.Latitude).toFixed(2)}°, ${Number(f.Longitude).toFixed(2)}°` },
]

function ComparablesTable({ features }) {
  const { data, error, loading } = useAsync(() => api.comparables(features), [JSON.stringify(features)])

  if (loading) return <div className="hv-card hv-skeleton comparables--loading" aria-hidden="true" />
  if (error) return <ErrorState message={error instanceof ApiError ? error.message : 'Could not load comparable properties.'} />
  if (!data || data.comparables.length === 0) {
    return <p className="comparables__empty">No comparable properties found.</p>
  }

  return (
    <div className="hv-card comparables__table-wrap">
      <table className="comparables__table">
        <thead>
          <tr>
            <th scope="col">Similarity</th>
            {ROWS.map((r) => (
              <th scope="col" key={r.key}>{r.title}</th>
            ))}
            <th scope="col">Recorded value</th>
          </tr>
        </thead>
        <tbody>
          {data.comparables.map((c, i) => (
            <tr key={i}>
              <td className="comparables__similarity">{c.similarity_pct.toFixed(0)}%</td>
              {ROWS.map((r) => (
                <td key={r.key}>{r.format(c.features)}</td>
              ))}
              <td className="comparables__price">${Math.round(c.actual_price_usd).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ComparableProperties({ setView }) {
  const { data, error, loading } = useAsync(() => api.predictions.list(), [])
  const latest = data?.predictions?.[0]

  if (loading) {
    return <div className="hv-card hv-skeleton comparables comparables--loading" aria-hidden="true" />
  }

  if (error) {
    return <ErrorState message={error instanceof ApiError ? error.message : 'Could not load your prediction history.'} />
  }

  if (!latest) {
    return (
      <section className="hv-card comparables comparables--empty">
        <span className="hv-empty-icon" aria-hidden="true">+</span>
        <p className="hv-label">Comparable Properties</p>
        <p className="comparables__empty-copy">
          Run a valuation first — this page finds the real dataset records most similar to
          your most recent prediction's inputs.
        </p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Start a Valuation
        </button>
      </section>
    )
  }

  return (
    <section className="comparables">
      <p className="hv-label">Comparable Properties</p>
      <p className="comparables__note">
        The real California Housing records closest to your most recent prediction's inputs,
        found by nearest-neighbor distance in the model's own scaled feature space. "Recorded
        value" is the real historical target for that record, not a prediction. Similarity is
        a distance-based score (100% = identical inputs), not a guarantee of relevance.
      </p>
      <ComparablesTable features={latest.features} />
    </section>
  )
}
