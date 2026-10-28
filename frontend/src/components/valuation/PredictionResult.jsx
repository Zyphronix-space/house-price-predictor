import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { formatUsd } from '../../lib/format'
import { describeFactor, topFactors } from '../../lib/plainLanguage'
import Select from '../Select'
import './PredictionResult.css'

export default function PredictionResult({
  result,
  areaLabel,
  unusual,
  stale,
  isGuest,
  returnPath,
  inComparison,
  onViewComparison,
  onWhatIf,
  onSaveComparison,
  onSaveHistory,
  onReport,
}) {
  const { data: housesRes } = useAsync(() => (isGuest ? Promise.resolve(null) : api.houses.list()), [isGuest])
  const [houseId, setHouseId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // A guest who asks to save sees why it needs an account, in place.
  const [showSavePrompt, setShowSavePrompt] = useState(false)

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
  const factors = topFactors(result.explanation)

  return (
    <section className={`prediction-result${stale ? ' is-stale' : ''}`} aria-labelledby="prediction-result-label">
      <p id="prediction-result-label" className="prediction-result__label">
        Estimated typical home value
      </p>
      <p className="prediction-result__value hv-tabular">{formatUsd(result.predicted_price_usd)}</p>
      <p className="prediction-result__qualifier">
        The model's estimate of the median home value in the neighbourhood
        {areaLabel ? ` near ${areaLabel}` : ''}, in 1990 prices. It is not an appraisal of a
        specific home and not today's market price.
      </p>

      {stale && (
        <p className="prediction-result__stale" role="status">
          You've changed the figures since this estimate. Select "Update estimate" to refresh it.
        </p>
      )}

      {range && (
        <div className="prediction-result__range">
          <p className="prediction-result__range-row">
            <span>Likely range</span>
            <span className="hv-tabular">
              {formatUsd(range.low_usd)} – {formatUsd(range.high_usd)}
            </span>
          </p>
          <p className="prediction-result__range-basis">
            Based on how far off the model usually is: when it was tested on areas it hadn't seen,
            8 in 10 real values fell within a band like this around its estimate.
          </p>
        </div>
      )}

      {unusual?.length > 0 && (
        <div className="prediction-result__warnings" role="note">
          <p className="prediction-result__warnings-title">Some figures are unusual, so this estimate is less reliable</p>
          {unusual.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {factors.length > 0 && (
        <div className="prediction-result__factors">
          <p className="prediction-result__factors-title">What mattered most</p>
          <ul>
            {factors.map((f) => (
              <li key={f.key} className={f.usd >= 0 ? 'is-up' : 'is-down'}>
                <span className="prediction-result__factor-mark" aria-hidden="true">{f.usd >= 0 ? '+' : '−'}</span>
                {describeFactor(f)}
              </li>
            ))}
          </ul>
          <p className="prediction-result__factors-note">
            This shows how the model weighed each detail, not proof of what drives prices.
          </p>
        </div>
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
        {isGuest && (
          <button
            type="button"
            className="hv-btn hv-btn-primary"
            onClick={() => setShowSavePrompt((s) => !s)}
            aria-expanded={showSavePrompt}
            aria-controls="prediction-result-save-prompt"
            disabled={stale}
          >
            Save to history
          </button>
        )}
        {inComparison ? (
          <button type="button" className="hv-btn hv-btn-secondary" onClick={onViewComparison}>
            View comparison
          </button>
        ) : (
          <button type="button" className="hv-btn hv-btn-secondary" onClick={onSaveComparison} disabled={stale}>
            Add to comparison
          </button>
        )}
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onWhatIf} disabled={stale}>
          Try what-if changes
        </button>
        <button type="button" className="hv-btn hv-btn-ghost" onClick={onReport} disabled={stale}>
          Printable report
        </button>
      </div>

      {isGuest && showSavePrompt && (
        <div id="prediction-result-save-prompt" className="prediction-result__save-prompt" role="region" aria-label="Save to history">
          <p className="prediction-result__save-title">Saving to history needs a free account</p>
          <p>
            Your history is stored in your account, so you can return to these estimates from any
            device. This estimate will still be here after you sign in. Then select "Save to
            history" again.
          </p>
          <p className="prediction-result__save-alt">
            Just comparing a few areas today? "Add to comparison" works without an account and
            keeps them on this device.
          </p>
          <div className="prediction-result__save-actions">
            <Link to="/signup" state={{ from: returnPath }} className="hv-btn hv-btn-primary">
              Create a free account
            </Link>
            <Link to="/login" state={{ from: returnPath }} className="hv-btn hv-btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
