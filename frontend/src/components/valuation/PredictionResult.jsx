import AnimatedNumber from '../AnimatedNumber'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import './PredictionResult.css'

export default function PredictionResult({ result, onWhatIf, onSaveComparison, onReport, onNewValuation }) {
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])

  return (
    <section className="hv-glass prediction-result">
      <p className="hv-label prediction-result__label">Model-estimated value</p>
      <AnimatedNumber value={result.predicted_price_usd} className="hv-stat-value prediction-result__value" />

      {result.estimated_range && (
        <p className="prediction-result__range">
          Estimated range: ${Math.round(result.estimated_range.low_usd).toLocaleString()} – $
          {Math.round(result.estimated_range.high_usd).toLocaleString()}
          <span className="prediction-result__range-basis"> · {result.estimated_range.basis}</span>
        </p>
      )}

      <div className="prediction-result__meta">
        <span>
          <span className="prediction-result__meta-label">Model</span>
          {modelInfo?.model_name ?? '—'}
        </span>
        <span>
          <span className="prediction-result__meta-label">Dataset</span>
          {modelInfo?.dataset ?? '—'}
        </span>
      </div>

      {result.warnings?.length > 0 && (
        <div className="prediction-result__warnings">
          {result.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <div className="prediction-result__actions">
        <button type="button" className="hv-btn hv-btn-primary" onClick={onWhatIf}>
          Try What-If
        </button>
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onSaveComparison}>
          Save to Comparison
        </button>
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onReport}>
          Generate Report
        </button>
        <button type="button" className="hv-btn hv-btn-ghost" onClick={onNewValuation}>
          New Valuation
        </button>
      </div>
    </section>
  )
}
