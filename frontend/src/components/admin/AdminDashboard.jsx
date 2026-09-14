import { useState } from 'react'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/authContext'
import { showToast } from '../../lib/toast'
import ConfirmDialog from '../ConfirmDialog'
import AdminChart from './AdminChart'
import './Admin.css'

const fmtUsd = (v) => (v == null ? '—' : `$${Math.round(v).toLocaleString()}`)
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export default function AdminDashboard() {
  const { user: me } = useAuth()
  const [reloadKey, setReloadKey] = useState(0)
  const { data: stats } = useAsync(() => api.admin.stats(), [reloadKey])
  const { data: usersRes, loading: usersLoading } = useAsync(() => api.admin.users(), [reloadKey])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const users = usersRes?.users ?? []

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.admin.deleteUser(pendingDelete.id)
      showToast(`Removed ${pendingDelete.email}`, 'success')
      setPendingDelete(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      showToast(err.message || 'Could not delete that user', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="admin">
      <div className="admin__hero">
        <p className="hv-label">Admin</p>
        <h1 className="admin__title">Platform overview</h1>
        <p className="admin__tagline">Every account, every prediction, in one place. Not visible to non-admin users.</p>
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

      <div className="hv-card admin-users">
        <p className="hv-label">Users ({users.length})</p>
        {usersLoading ? (
          <p className="admin-users__empty">Loading...</p>
        ) : users.length === 0 ? (
          <p className="admin-users__empty">No users yet.</p>
        ) : (
          <div className="admin-users__table-wrap">
            <table className="admin-users__table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined</th>
                  <th>Properties</th>
                  <th>Predictions</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-users__identity">
                        <span className="admin-users__name">
                          {u.display_name || u.email}
                          {u.is_admin && <span className="admin-users__badge">Admin</span>}
                          {u.id === me?.id && <span className="admin-users__badge admin-users__badge--you">You</span>}
                        </span>
                        {u.display_name && <span className="admin-users__email">{u.email}</span>}
                      </div>
                    </td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td>{u.house_count}</td>
                    <td>{u.prediction_count}</td>
                    <td>
                      {u.id !== me?.id && (
                        <button
                          type="button"
                          className="hv-btn hv-btn-ghost admin-users__delete"
                          onClick={() => setPendingDelete(u)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this user?"
        message={
          pendingDelete
            ? `This permanently deletes ${pendingDelete.email} and all ${pendingDelete.prediction_count} of their predictions and ${pendingDelete.house_count} saved properties. This can't be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete user'}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}
