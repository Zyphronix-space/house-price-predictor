import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getComparison, removeFromComparison, clearComparison, MAX_COMPARISON_PROPERTIES } from '../../lib/storage'
import { useAuth } from '../../lib/authContext'
import { formatUsd } from '../../lib/format'
import { AREA_FACTS } from '../../lib/plainLanguage'
import './PropertyComparison.css'

const FALLBACK_LABELS = ['Area A', 'Area B', 'Area C', 'Area D']

const ROWS = [
  ...AREA_FACTS.map((f) => ({ key: f.name, title: f.label, format: (features) => f.format(Number(features[f.name])) })),
  {
    key: 'location',
    title: 'Location',
    format: (f) => `${Number(f.Latitude).toFixed(2)}°, ${Number(f.Longitude).toFixed(2)}°`,
  },
]

// The comparison list lives in this browser's localStorage for everyone,
// signed in or not -- it is never sent to the API, so the page says so.
export default function PropertyComparison({ setView }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState(() => getComparison())
  const labelOf = (entry, i) => entry.label || FALLBACK_LABELS[i]

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
        <h1 className="comparison__title">Compare areas</h1>
        <p className="comparison__empty-copy">
          Estimate an area, then choose "Add to comparison" to line up to{' '}
          {MAX_COMPARISON_PROPERTIES} areas side by side. No account needed.
        </p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Estimate an area
        </button>
      </section>
    )
  }

  return (
    <section className="comparison">
      <div className="comparison__header">
        <div>
          <h1 className="comparison__title">Compare areas</h1>
          <p className="comparison__note">
            Kept in this browser on this device only{user ? ', not in your account' : ''}. Values are
            1990 neighbourhood medians, not today's prices.
          </p>
        </div>
        <div className="comparison__header-actions">
          {entries.length < MAX_COMPARISON_PROPERTIES && (
            <button type="button" className="hv-btn hv-btn-secondary" onClick={() => setView('predict')}>
              Add another area
            </button>
          )}
          <button type="button" className="hv-btn hv-btn-ghost" onClick={clear}>
            Clear all
          </button>
        </div>
      </div>

      <div className="comparison__cards">
        {entries.map((entry, i) => (
          <div key={entry.id} className="hv-card comparison__card">
            <p className="comparison__card-label">{labelOf(entry, i)}</p>
            <p className="comparison__price hv-tabular">{formatUsd(entry.predictedPriceUsd)}</p>
            <button
              type="button"
              className="hv-btn hv-btn-ghost comparison__remove"
              onClick={() => remove(entry.id)}
              aria-label={`Remove ${labelOf(entry, i)}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="hv-card comparison__table-wrap">
        <table className="comparison__table">
          <thead>
            <tr>
              <th scope="col">1990 figures</th>
              {entries.map((entry, i) => (
                <th scope="col" key={entry.id}>{labelOf(entry, i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Estimated typical home value</th>
              {entries.map((entry) => (
                <td key={entry.id} className="hv-tabular">{formatUsd(entry.predictedPriceUsd)}</td>
              ))}
            </tr>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.title}</th>
                {entries.map((entry) => (
                  <td key={entry.id} className="hv-tabular">{row.format(entry.features)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!user && (
        <p className="comparison__account">
          Want estimates you can open on any device? A free account keeps a saved history.{' '}
          <Link to="/signup" state={{ from: '/compare' }}>Create one</Link> or{' '}
          <Link to="/login" state={{ from: '/compare' }}>sign in</Link>.
        </p>
      )}
    </section>
  )
}
