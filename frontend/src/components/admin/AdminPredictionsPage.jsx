import { useState } from 'react'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { showToast } from '../../lib/toast'
import ConfirmDialog from '../ConfirmDialog'
import './Admin.css'

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`
const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function AdminPredictionsPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const { data: predictionsRes, loading } = useAsync(() => api.admin.predictions(), [reloadKey])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const predictions = predictionsRes?.predictions ?? []

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await api.admin.deletePrediction(pendingDelete.id)
      showToast('Prediction removed', 'success')
      setPendingDelete(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      showToast(err.message || 'Could not delete that prediction', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin">
      <div className="admin__hero">
        <p className="hv-label">Admin</p>
        <h1 className="admin__title">Predictions</h1>
        <p className="admin__tagline">Every valuation run across every account (most recent 200). Predictions are a
          point-in-time snapshot, so only removal is offered here, not editing.</p>
      </div>

      <div className="hv-card admin-users">
        <p className="hv-label">Predictions ({predictions.length})</p>
        {loading ? (
          <p className="admin-users__empty">Loading...</p>
        ) : predictions.length === 0 ? (
          <p className="admin-users__empty">No predictions yet.</p>
        ) : (
          <div className="admin-users__table-wrap">
            <table className="admin-users__table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Property</th>
                  <th>Predicted value</th>
                  <th>Model</th>
                  <th>Date</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.owner_email}</td>
                    <td>{p.house_label || '—'}</td>
                    <td>{fmtUsd(p.predicted_price_usd)}</td>
                    <td>{p.model_used}</td>
                    <td>{fmtDate(p.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="hv-btn hv-btn-ghost admin-users__delete"
                        onClick={() => setPendingDelete(p)}
                      >
                        Delete
                      </button>
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
        title="Delete this prediction?"
        message={pendingDelete ? `This permanently deletes ${pendingDelete.owner_email}'s ${fmtUsd(pendingDelete.predicted_price_usd)} prediction. This can't be undone.` : ''}
        confirmLabel={busy ? 'Deleting...' : 'Delete prediction'}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}
