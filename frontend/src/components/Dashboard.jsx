import { api } from '../lib/api'
import { useAsync } from '../lib/hooks'
import { useAuth } from '../lib/authContext'
import { getComparison } from '../lib/storage'
import SystemStatus from './SystemStatus'
import ActivityChart from './dashboard/ActivityChart'
import PredictionDistributionChart from './dashboard/PredictionDistributionChart'
import './Dashboard.css'

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard({ setView }) {
  const { user } = useAuth()
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])
  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const { data: summary } = useAsync(() => api.dashboardSummary(), [])
  const { data: predictionsRes } = useAsync(() => api.predictions.list(), [])

  const predictions = predictionsRes?.predictions ?? []
  const comparisonCount = getComparison().length
  const mostRecent = summary?.recent_predictions?.[0]

  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <p className="hv-label">{greeting()}{user?.display_name ? `, ${user.display_name}` : ''}</p>
        <h1 className="dashboard__headline">Your Real Estate Intelligence</h1>
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

        <div className="dashboard__quick-actions" aria-label="Quick actions">
          <button type="button" className="hv-btn hv-btn-secondary" onClick={() => setView('predict')}>
            New Prediction
          </button>
          <button type="button" className="hv-btn hv-btn-secondary" onClick={() => setView('compare')}>
            Compare Properties
          </button>
          <button type="button" className="hv-btn hv-btn-secondary" onClick={() => setView('whatif')}>
            What-If Analysis
          </button>
        </div>
      </div>

      <div className="dashboard__stats">
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Predictions made</p>
          <p className="dashboard__stat-value">{summary?.total_predictions ?? '—'}</p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Saved properties</p>
          <p className="dashboard__stat-value">{summary?.total_properties ?? '—'}</p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Average predicted value</p>
          <p className="dashboard__stat-value dashboard__stat-value--small">
            {summary?.average_predicted_price_usd != null ? fmtUsd(summary.average_predicted_price_usd) : '—'}
          </p>
        </div>
        <div className="hv-card dashboard__stat">
          <p className="hv-label">Recent activity</p>
          <p className="dashboard__stat-value dashboard__stat-value--small">
            {mostRecent ? timeAgo(mostRecent.created_at) : 'No activity yet'}
          </p>
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

      {predictions.length >= 2 ? (
        <div className="dashboard__charts">
          <ActivityChart predictions={predictions} />
          <PredictionDistributionChart predictions={predictions} />
        </div>
      ) : (
        <div className="hv-card dashboard-chart--empty">
          Run a couple more valuations to unlock your activity and distribution charts.
        </div>
      )}

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

      <div className="dashboard__split">
        <div className="dashboard__recent">
          <p className="hv-label">Recent predictions</p>
          {!summary || summary.recent_predictions.length === 0 ? (
            <p className="dashboard__recent-empty">No predictions yet — run your first valuation to see it here.</p>
          ) : (
            <div className="hv-card dashboard__recent-table-wrap">
              <table className="dashboard__recent-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Predicted value</th>
                    <th scope="col">Property</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent_predictions.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="hv-tabular">{fmtUsd(entry.predicted_price_usd)}</td>
                      <td>{entry.house_label ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="hv-card dashboard__comparison">
          <p className="hv-label">Comparison basket</p>
          {comparisonCount === 0 ? (
            <p className="dashboard__recent-empty">
              No properties saved for comparison yet — save one after a prediction.
            </p>
          ) : (
            <p className="dashboard__comparison-count">
              {comparisonCount} propert{comparisonCount === 1 ? 'y' : 'ies'} ready to compare.
            </p>
          )}
          <button type="button" className="hv-btn hv-btn-secondary" onClick={() => setView('compare')}>
            {comparisonCount === 0 ? 'Go to Compare' : 'View Comparison'}
          </button>
        </div>
      </div>
    </section>
  )
}
