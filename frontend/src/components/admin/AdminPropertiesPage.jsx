import { useState } from 'react'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { showToast } from '../../lib/toast'
import ConfirmDialog from '../ConfirmDialog'
import Modal from '../Modal'
import './Admin.css'

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export default function AdminPropertiesPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const { data: housesRes, loading } = useAsync(() => api.admin.houses(), [reloadKey])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const houses = housesRes?.houses ?? []

  const openEdit = (h) => {
    setEditing(h)
    setEditLabel(h.label)
    setEditNotes(h.notes || '')
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.admin.updateHouse(editing.id, { label: editLabel, notes: editNotes })
      showToast('Property updated', 'success')
      setEditing(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      showToast(err.message || 'Could not update that property', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await api.admin.deleteHouse(pendingDelete.id)
      showToast(`Removed "${pendingDelete.label}"`, 'success')
      setPendingDelete(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      showToast(err.message || 'Could not delete that property', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin">
      <div className="admin__hero">
        <p className="hv-label">Admin</p>
        <h1 className="admin__title">Properties</h1>
        <p className="admin__tagline">Every saved property across every account.</p>
      </div>

      <div className="hv-card admin-users">
        <p className="hv-label">Properties ({houses.length})</p>
        {loading ? (
          <p className="admin-users__empty">Loading...</p>
        ) : houses.length === 0 ? (
          <p className="admin-users__empty">No properties saved yet.</p>
        ) : (
          <div className="admin-users__table-wrap">
            <table className="admin-users__table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Saved</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {houses.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <div className="admin-users__identity">
                        <span className="admin-users__name">{h.label}</span>
                        {h.notes && <span className="admin-users__email">{h.notes}</span>}
                      </div>
                    </td>
                    <td>{h.owner_email}</td>
                    <td>
                      {h.latitude.toFixed(2)}, {h.longitude.toFixed(2)}
                    </td>
                    <td>{fmtDate(h.created_at)}</td>
                    <td>
                      <div className="admin-users__row-actions">
                        <button type="button" className="hv-btn hv-btn-ghost" onClick={() => openEdit(h)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="hv-btn hv-btn-ghost admin-users__delete"
                          onClick={() => setPendingDelete(h)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} title="Edit property" onClose={() => setEditing(null)}>
        {editing && (
          <div className="admin-edit-form">
            <label className="admin-edit-form__field">
              <span className="hv-label">Label</span>
              <input type="text" className="hv-input" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
            </label>
            <label className="admin-edit-form__field">
              <span className="hv-label">Notes</span>
              <input type="text" className="hv-input" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </label>
            <div className="admin-edit-form__actions">
              <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="hv-btn hv-btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this property?"
        message={pendingDelete ? `This permanently deletes "${pendingDelete.label}" (owned by ${pendingDelete.owner_email}). This can't be undone.` : ''}
        confirmLabel={busy ? 'Deleting...' : 'Delete property'}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}
