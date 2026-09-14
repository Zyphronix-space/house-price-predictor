import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import AdminChart from './AdminChart'
import './Admin.css'

const fmtUsd = (v) => (v == null ? '—' : `$${Math.round(v).toLocaleString()}`)

export default function AdminOverview() {
  const { data: stats } = useAsync(() => api.admin.stats(), [])

  return (
    <section className="admin">
      <div className="admin__hero">
        <p className="hv-label">Admin</p>
        <h1 className="admin__title">Platform overview</h1>
        <p className="admin__tagline">Every account, every prediction, in one place.</p>
      </div>

      <div className="admin__stats">
        <div className="hv-card admin-stat">
          <span className="hv-label">Total users</span>
          <span className="admin-stat__value">{stats?.total_users ?? '—'}</span>
        </div>
        <div className="hv-card admin-stat">
          <span className="hv-label">Total predictions</span>
          <span className="admin-stat__value">{stats?.total_predictions ?? '—'}</span>
        </div>
        <div className="hv-card admin-stat">
          <span className="hv-label">Saved properties</span>
          <span className="admin-stat__value">{stats?.total_houses ?? '—'}</span>
        </div>
        <div className="hv-card admin-stat">
          <span className="hv-label">Avg. predicted value</span>
          <span className="admin-stat__value">{fmtUsd(stats?.average_predicted_price_usd)}</span>
        </div>
      </div>

      {stats && (
        <div className="admin__charts">
          <AdminChart label="Signups (last 14 days)" days={stats.signups_last_14_days} />
          <AdminChart label="Predictions (last 14 days)" days={stats.predictions_last_14_days} />
        </div>
      )}
    </section>
  )
}
