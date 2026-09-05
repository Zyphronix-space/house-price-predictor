import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import ErrorState from '../ErrorState'
import './ModelLab.css'

export default function ModelLab() {
  const { data, error, loading } = useAsync(() => api.modelComparison(), [])

  if (loading) return <div className="hv-card hv-skeleton model-lab model-lab--loading" aria-hidden="true" />
  if (error) return <ErrorState message={error.message} />

  const entries = Object.entries(data.models)

  return (
    <section className="model-lab">
      <p className="model-lab__intro">
        Measured on the same held-out 20% test split ({data.test_size * 100}%, seed{' '}
        {data.random_state}) of the {data.dataset} dataset.
      </p>

      <div className="model-lab__cards">
        {entries.map(([key, model]) => (
          <div key={key} className={`hv-card model-lab__card ${key === data.served_model ? 'is-served' : ''}`}>
            {key === data.served_model && <span className="model-lab__badge">Currently served</span>}
            <p className="model-lab__name">{model.name}</p>
            <div className="model-lab__metrics">
              <div>
                <p className="hv-label">MAE (held-out)</p>
                <p className="model-lab__metric-value">${model.mae_usd.toLocaleString()}</p>
              </div>
              {model.rmse_usd !== undefined && (
                <div>
                  <p className="hv-label">RMSE (held-out)</p>
                  <p className="model-lab__metric-value">${model.rmse_usd.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="hv-label">R² (held-out)</p>
                <p className="model-lab__metric-value">{model.r2}</p>
              </div>
              {model.training_time_seconds !== undefined && (
                <div>
                  <p className="hv-label">Training time</p>
                  <p className="model-lab__metric-value">{model.training_time_seconds}s</p>
                </div>
              )}
            </div>
            {model.cv_r2_mean !== undefined && (
              <div className="model-lab__cv">
                <p className="hv-label">{model.cv_folds}-fold cross-validation (train split)</p>
                <div className="model-lab__metrics">
                  <div>
                    <p className="model-lab__cv-label">MAE</p>
                    <p className="model-lab__cv-value">
                      ${model.cv_mae_usd_mean.toLocaleString()} ± ${model.cv_mae_usd_std.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="model-lab__cv-label">R²</p>
                    <p className="model-lab__cv-value">
                      {model.cv_r2_mean} ± {model.cv_r2_std}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hv-card model-lab__rationale">
        <p className="hv-label">Why this model is served</p>
        <p>{data.rationale}</p>
      </div>
    </section>
  )
}
