import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import PropertySummary from './PropertySummary'
import './ValuationReport.css'

export default function ValuationReport({ features, result, onClose }) {
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])
  const generatedAt = new Date()

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
        <p className="hv-label">Property valuation</p>
        <h2 className="valuation-report__title">Machine-learning valuation estimate</h2>
        <p className="valuation-report__value">
          ${Math.round(result.predicted_price_usd).toLocaleString()}
        </p>

        <PropertySummary features={features} title="Property characteristics" />

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
          This is a machine-learning valuation estimate, not a licensed property appraisal
          or a guarantee of market price. It is produced by a statistical model trained on
          the public California Housing dataset and may not reflect factors such as
          condition, renovations, schools, or recent comparable sales.
        </p>
      </div>
    </div>
  )
}
