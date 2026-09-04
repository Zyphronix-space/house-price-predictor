import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import PropertySummary from './PropertySummary'
import './ValuationReport.css'

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`

function ComparablesMini({ features }) {
  const { data } = useAsync(() => api.comparables(features, 3), [JSON.stringify(features)])
  if (!data || data.comparables.length === 0) return null

  return (
    <div className="valuation-report__comparables">
      <p className="valuation-report__section-title">Comparable properties (top 3 by similarity)</p>
      <ul>
        {data.comparables.map((c, i) => (
          <li key={i}>
            {c.similarity_pct.toFixed(0)}% similar — recorded value {fmtUsd(c.actual_price_usd)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ValuationReport({ features, result, onClose }) {
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])
  const generatedAt = new Date()
  const topFactors = [...(result.explanation?.top_positive ?? []), ...(result.explanation?.top_negative ?? [])]
    .sort((a, b) => Math.abs(b.shap_usd) - Math.abs(a.shap_usd))
    .slice(0, 5)

  return (
    <div className="valuation-report">
      <div className="valuation-report__toolbar">
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onClose}>
          Close
        </button>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <div className="hv-card valuation-report__sheet">
        <p className="hv-label">Property valuation report</p>
        <h2 className="valuation-report__title">Machine-learning valuation estimate</h2>
        <p className="valuation-report__value">{fmtUsd(result.predicted_price_usd)}</p>
        {result.estimated_range && (
          <p className="valuation-report__range">
            Estimated range: {fmtUsd(result.estimated_range.low_usd)} – {fmtUsd(result.estimated_range.high_usd)}
          </p>
        )}

        <PropertySummary features={features} title="Property characteristics" />

        {topFactors.length > 0 && (
          <div className="valuation-report__factors">
            <p className="valuation-report__section-title">Key factors (SHAP)</p>
            <ul>
              {topFactors.map((f) => (
                <li key={f.feature} className={f.direction === 'positive' ? 'is-positive' : 'is-negative'}>
                  {f.label}: {f.shap_usd >= 0 ? '+' : '-'}{fmtUsd(Math.abs(f.shap_usd))}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ComparablesMini features={features} />

        <dl className="valuation-report__meta">
          <div>
            <dt>Model used</dt>
            <dd>{modelInfo?.model_name ?? '—'}</dd>
          </div>
          <div>
            <dt>Model performance (test set)</dt>
            <dd>
              {modelInfo ? `MAE $${modelInfo.metrics.mae_usd.toLocaleString()} · R² ${modelInfo.metrics.r2}` : '—'}
            </dd>
          </div>
          <div>
            <dt>Dataset</dt>
            <dd>{modelInfo?.dataset ?? '—'} (block-group level, not individual listings)</dd>
          </div>
          <div>
            <dt>Generated</dt>
            <dd>{generatedAt.toLocaleString()}</dd>
          </div>
        </dl>

        <p className="valuation-report__disclaimer">
          This is a machine-learning valuation estimate for an educational/demo project, not a
          licensed property appraisal or a guarantee of market price. It is produced by a
          statistical model trained on the public California Housing dataset and may not
          reflect factors such as condition, renovations, schools, or recent comparable sales.
        </p>
      </div>
    </div>
  )
}
