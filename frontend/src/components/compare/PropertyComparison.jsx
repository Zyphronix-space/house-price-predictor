import { useState } from 'react'
import { getComparison, removeFromComparison, clearComparison, MAX_COMPARISON_PROPERTIES } from '../../lib/storage'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import './PropertyComparison.css'

const LABELS = ['Property A', 'Property B', 'Property C', 'Property D']

const ROWS = [
  { key: 'MedInc', title: 'Income', format: (f) => `$${Math.round(f.MedInc * 10_000).toLocaleString()}` },
  { key: 'AveRooms', title: 'Rooms', format: (f) => Number(f.AveRooms).toFixed(2) },
  { key: 'AveBedrms', title: 'Bedrooms', format: (f) => Number(f.AveBedrms).toFixed(2) },
  { key: 'HouseAge', title: 'House age', format: (f) => `${f.HouseAge} yrs` },
  { key: 'AveOccup', title: 'Occupancy', format: (f) => Number(f.AveOccup).toFixed(2) },
  { key: 'location', title: 'Location', format: (f) => `${Number(f.Latitude).toFixed(2)}°, ${Number(f.Longitude).toFixed(2)}°` },
  {
    key: 'value',
    title: 'Estimated value',
    format: (_f, entry) => `$${Math.round(entry.predictedPriceUsd).toLocaleString()}`,
  },
]

export default function PropertyComparison({ setView }) {
  const [entries, setEntries] = useState(() => getComparison())
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])

  const remove = (id) => {
    removeFromComparison(id)
    setEntries(getComparison())
  }

  const clear = () => {
    clearComparison()
    setEntries([])
  }

  if (entries.length === 0) {
    return (
      <section className="hv-card comparison comparison--empty">
        <span className="hv-empty-icon" aria-hidden="true">+</span>
        <p className="hv-label">Compare Properties</p>
        <p className="comparison__empty-copy">
          Run a valuation and choose "Save to Comparison" to line up to{' '}
          {MAX_COMPARISON_PROPERTIES} properties side by side.
        </p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Start Valuation
        </button>
      </section>
    )
  }

  return (
    <section className="comparison">
      <div className="comparison__header">
        <p className="hv-label">Compare Saved Properties</p>
        <div className="comparison__header-actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('history')}>
            ← Back to History
          </button>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={clear}>
            Clear all
          </button>
        </div>
      </div>

      <div className="comparison__cards">
        {entries.map((entry, i) => (
          <div key={entry.id} className="hv-card comparison__card">
            <p className="hv-label">{LABELS[i]}</p>
            <p className="comparison__price">${Math.round(entry.predictedPriceUsd).toLocaleString()}</p>
            <button type="button" className="hv-btn hv-btn-ghost comparison__remove" onClick={() => remove(entry.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="hv-card comparison__table-wrap">
        <table className="comparison__table">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {entries.map((_, i) => (
                <th scope="col" key={i}>{LABELS[i]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.title}</th>
                {entries.map((entry) => (
                  <td key={entry.id}>{row.format(entry.features, entry)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Model</th>
              {entries.map((entry) => (
                <td key={entry.id}>{modelInfo?.model_name ?? '-'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
