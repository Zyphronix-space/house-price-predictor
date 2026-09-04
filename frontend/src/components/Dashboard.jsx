import { api } from '../lib/api'
import { useAsync } from '../lib/hooks'
import SystemStatus from './SystemStatus'
import './Dashboard.css'

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`

export default function Dashboard({ setView }) {
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])
  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const { data: summary } = useAsync(() => api.dashboardSummary(), [])

  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <p className="hv-label">Home Value — Dashboard</p>
        <h1 className="dashboard__headline">AI Real Estate Analytics</h1>
        <p className="dashboard__tagline">
          A machine-learning valuation platform: predictions, explanations, comparables,
          scenario simulation, and model analytics — all built on one real trained model.
        </p>
        <div className="dashboard__cta">
          <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
            Start a Valuation
          </button>
          <SystemStatus />
        </div>
      </div>

      <div className="dashboard__stats">
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Total properties</p>
          <p className="dashboard__stat-value">{summary?.total_properties ?? '—'}</p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Total predictions</p>
          <p className="dashboard__stat-value">{summary?.total_predictions ?? '—'}</p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Average predicted price</p>
          <p className="dashboard__stat-value dashboard__stat-value--small">
            {summary?.average_predicted_price_usd != null ? fmtUsd(summary.average_predicted_price_usd) : '—'}
          </p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">R² (held-out test)</p>
          <p className="dashboard__stat-value">{modelInfo?.metrics.r2 ?? '—'}</p>
        </div>
      </div>

      <div className="dashboard__stats">
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Highest prediction</p>
          <p className="dashboard__stat-value dashboard__stat-value--small">
            {summary?.highest_predicted_price_usd != null ? fmtUsd(summary.highest_predicted_price_usd) : '—'}
          </p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Lowest prediction</p>
          <p className="dashboard__stat-value dashboard__stat-value--small">
            {summary?.lowest_predicted_price_usd != null ? fmtUsd(summary.lowest_predicted_price_usd) : '—'}
          </p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Served model</p>
          <p className="dashboard__stat-value dashboard__stat-value--small">{modelInfo?.model_name ?? '—'}</p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Training records</p>
          <p className="dashboard__stat-value">{datasetStats ? datasetStats.n_records.toLocaleString() : '—'}</p>
        </div>
      </div>

      <div className="dashboard__quicklinks">
        {[
          { key: 'properties', label: 'Properties', desc: 'Add, edit, and manage your saved properties' },
          { key: 'analysis', label: 'Analysis', desc: 'Distributions, correlations, model fit' },
          { key: 'comparables', label: 'Comparable Properties', desc: 'Nearest real matches to your last prediction' },
          { key: 'whatif', label: 'What-If Simulator', desc: 'Explore scenarios interactively' },
          { key: 'investment', label: 'Investment Calculator', desc: 'Mortgage, cash flow, ROI' },
          { key: 'model', label: 'Model Performance', desc: 'Comparison, cross-validation, errors' },
        ].map((link) => (
          <button key={link.key} type="button" className="hv-card dashboard__quicklink" onClick={() => setView(link.key)}>
            <span className="dashboard__quicklink-label">{link.label}</span>
            <span className="dashboard__quicklink-desc">{link.desc}</span>
          </button>
        ))}
      </div>

      <div className="dashboard__recent">
        <p className="hv-label">Recent predictions</p>
        {!summary || summary.recent_predictions.length === 0 ? (
          <p className="dashboard__recent-empty">No predictions yet — run your first valuation to see it here.</p>
        ) : (
          <ul className="dashboard__recent-list">
            {summary.recent_predictions.map((entry) => (
              <li key={entry.id} className="dashboard__recent-row">
                <span>{fmtUsd(entry.predicted_price_usd)}</span>
                <span className="dashboard__recent-time">
                  {new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
