import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import './ModelExplainability.css'

export default function ModelExplainability() {
  const { data, loading } = useAsync(() => api.modelInfo(), [])

  if (loading || !data) {
    return <div className="hv-card hv-skeleton model-explainability model-explainability--loading" aria-hidden="true" />
  }

  const importances = data.feature_importance
  const max = Math.max(...importances.map((f) => f.importance))

  return (
    <section className="hv-card model-explainability">
      <p className="hv-label">How the model sees your property</p>
      <p className="model-explainability__note">
        {data.model_name} scores each feature by how much it contributed to the model's
        predictions overall (relative influence). This is not a per-property, per-dollar
        effect, and it doesn't say whether a feature pushes value up or down for a given
        property, only how much the model leans on it.
      </p>
      <ul className="model-explainability__bars">
        {importances.map((f) => (
          <li key={f.feature} className="model-explainability__row">
            <span className="model-explainability__row-label">{f.label}</span>
            <span className="model-explainability__row-track">
              <span
                className="model-explainability__row-fill"
                style={{ width: `${(f.importance / max) * 100}%` }}
              />
            </span>
            <span className="model-explainability__row-value">{(f.importance * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
