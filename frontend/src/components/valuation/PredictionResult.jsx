import { useState } from 'react'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { FEATURE_ORDER, FIELD_META } from '../../lib/fields'
import { formatUsd } from '../../lib/format'
import Select from '../Select'
import './PredictionResult.css'

const fmtInput = (name, v) => {
  const n = Number(v)
  if (name === 'MedInc') return `${formatUsd(n * 10_000)}`
  if (name === 'Population') return Math.round(n).toLocaleString()
  if (name === 'Latitude' || name === 'Longitude') return n.toFixed(2)
  return Number(n.toFixed(2)).toLocaleString()
}

export default function PredictionResult({
  result,
  inputs,
  stale,
  isGuest,
  onWhatIf,
  onSaveComparison,
  onSaveHistory,
  onReport,
}) {
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])
  const { data: housesRes } = useAsync(() => (isGuest ? Promise.resolve(null) : api.houses.list()), [isGuest])
  const [houseId, setHouseId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveHistory = async () => {
    setSaving(true)
    try {
      await onSaveHistory(houseId || null)
      setSaved(true)
    } catch {
      // onSaveHistory already surfaced the error as a toast; keep the
      // button enabled so the user can retry.
    } finally {
      setSaving(false)
    }
  }

  const range = result.estimated_range

  return (
    <section className={`hv-glass prediction-result${stale ? ' is-stale' : ''}`} aria-labelledby="prediction-result-label" aria-live="polite">
      <p id="prediction-result-label" className="prediction-result__label">
        Estimated median home value
      </p>
      <p className="hv-stat-value prediction-result__value">{formatUsd(result.predicted_price_usd)}</p>
      <p className="prediction-result__qualifier">
        {modelInfo?.model_name ?? 'Model'} estimate for this block group, in 1990 US dollars. Not an
        appraisal or a sale price.
      </p>

      {stale && (
        <p className="prediction-result__stale" role="status">
          Inputs have changed since this estimate. Run the estimate again to update it.
        </p>
      )}

      {range && (
        <div className="prediction-result__range">
          <div className="prediction-result__range-row">
            <span>Typical error range</span>
            <span className="hv-tabular">
              {formatUsd(range.low_usd)} – {formatUsd(range.high_usd)}
            </span>
          </div>
          <p className="prediction-result__range-basis">
            The middle 80% of this model's errors on held-out test data, applied to this estimate.
            It is an empirical range, not a statistical confidence interval.
          </p>
        </div>
      )}

      {result.warnings?.length > 0 && (
        <div className="prediction-result__warnings" role="note">
          {result.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {inputs && (
        <details className="prediction-result__inputs">
          <summary>Inputs used</summary>
          <dl>
            {FEATURE_ORDER.map((name) => (
              <div key={name}>
                <dt>{FIELD_META[name].label}</dt>
                <dd className="hv-tabular">{fmtInput(name, inputs[name])}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {!isGuest && housesRes?.houses.length > 0 && !saved && (
        <div className="prediction-result__house-picker">
          <span className="prediction-result__picker-label">Link to a saved property (optional)</span>
          <Select
            ariaLabel="Link to a saved property"
            value={houseId}
            onChange={setHouseId}
            options={[
              { value: '', label: 'None' },
              ...housesRes.houses.map((h) => ({ value: String(h.id), label: h.label })),
            ]}
          />
        </div>
      )}

      <div className="prediction-result__actions">
        {!isGuest && (
          <button
            type="button"
            className="hv-btn hv-btn-primary"
            onClick={handleSaveHistory}
            disabled={saving || saved || stale}
            aria-busy={saving}
          >
            {saving && <span className="hv-spinner" aria-hidden="true" />}
            {saved ? 'Saved to history' : saving ? 'Saving' : 'Save to history'}
          </button>
        )}
        {!isGuest && (
          <button type="button" className="hv-btn hv-btn-secondary" onClick={onSaveComparison} disabled={stale}>
            Add to comparison
          </button>
        )}
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onWhatIf} disabled={stale}>
          What-if
        </button>
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onReport} disabled={stale}>
          Report
        </button>
      </div>
    </section>
  )
}
