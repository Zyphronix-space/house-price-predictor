import { useState } from 'react'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/authContext'
import { showToast } from '../../lib/toast'
import ConfirmDialog from '../ConfirmDialog'
import Modal from '../Modal'
import './Admin.css'

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export default function AdminUsersPage() {
  const { user: me } = useAuth()
  const [reloadKey, setReloadKey] = useState(0)
  const { data: usersRes, loading } = useAsync(() => api.admin.users(), [reloadKey])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAdmin, setEditAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const users = usersRes?.users ?? []
  const reload = () => setReloadKey((k) => k + 1)

  const openEdit = (u) => {
    setEditing(u)
    setEditName(u.display_name || '')
    setEditAdmin(u.is_admin)
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.admin.updateUser(editing.id, { display_name: editName, is_admin: editAdmin })
      showToast(`Updated ${editing.email}`, 'success')
      setEditing(null)
      reload()
    } catch (err) {
      showToast(err.message || 'Could not update that user', 'error')
    } finally {
      setSaving(false)
    }
  }

  // A one-click toggle right in the row -- the Edit modal still exists for
  // changing display name at the same time, but promoting/demoting
  // shouldn't require opening a dialog first.
  const toggleAdmin = async (u) => {
    setTogglingId(u.id)
    try {
      await api.admin.updateUser(u.id, { is_admin: !u.is_admin })
      showToast(u.is_admin ? `Revoked admin access for ${u.email}` : `Made ${u.email} an admin`, 'success')
      reload()
    } catch (err) {
      showToast(err.message || 'Could not change admin access', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await api.admin.deleteUser(pendingDelete.id)
      showToast(`Deactivated ${pendingDelete.email}`, 'success')
      setPendingDelete(null)
      reload()
    } catch (err) {
      showToast(err.message || 'Could not deactivate that user', 'error')
    } finally {
      setBusy(false)
    }
  }

  const restore = async (u) => {
    setTogglingId(u.id)
    try {
      await api.admin.restoreUser(u.id)
      showToast(`Restored ${u.email}`, 'success')
      reload()
    } catch (err) {
      showToast(err.message || 'Could not restore that user', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section className="admin">
      <div className="admin__hero">
        <p className="hv-label">Admin</p>
        <h1 className="admin__title">Users</h1>
        <p className="admin__tagline">
          Edit display names, promote or revoke admin access, or deactivate an account. Deactivating is a soft
          delete: the account and its data stay intact and can be restored, they just can't sign in.
        </p>
      </div>

      <div className="hv-card admin-users">
        <p className="hv-label">Users ({users.length})</p>
        {loading ? (
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
                  <tr key={u.id} className={u.deleted_at ? 'admin-users__row--deleted' : ''}>
                    <td>
                      <div className="admin-users__identity">
                        <span className="admin-users__name">
                          {u.display_name || u.email}
                          {u.is_admin && <span className="admin-users__badge">Admin</span>}
                          {u.id === me?.id && <span className="admin-users__badge admin-users__badge--you">You</span>}
                          {u.deleted_at && <span className="admin-users__badge admin-users__badge--deleted">Deactivated</span>}
                        </span>
                        {u.display_name && <span className="admin-users__email">{u.email}</span>}
                      </div>
                    </td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td>{u.house_count}</td>
                    <td>{u.prediction_count}</td>
                    <td>
                      <div className="admin-users__row-actions">
                        {u.deleted_at ? (
                          <button
                            type="button"
                            className="hv-btn hv-btn-ghost"
                            onClick={() => restore(u)}
                            disabled={togglingId === u.id}
                          >
                            {togglingId === u.id ? 'Restoring...' : 'Restore'}
                          </button>
                        ) : (
                          <>
                            {u.id !== me?.id && (
                              <button
                                type="button"
                                className="hv-btn hv-btn-ghost"
                                onClick={() => toggleAdmin(u)}
                                disabled={togglingId === u.id}
                              >
                                {togglingId === u.id ? '...' : u.is_admin ? 'Revoke admin' : 'Make admin'}
                              </button>
                            )}
                            <button type="button" className="hv-btn hv-btn-ghost" onClick={() => openEdit(u)}>
                              Edit
                            </button>
                            {u.id !== me?.id && (
                              <button
                                type="button"
                                className="hv-btn hv-btn-ghost admin-users__delete"
                                onClick={() => setPendingDelete(u)}
                              >
                                Deactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} title="Edit user" onClose={() => setEditing(null)}>
        {editing && (
          <div className="admin-edit-form">
            <label className="admin-edit-form__field">
              <span className="hv-label">Display name</span>
              <input
                type="text"
                className="hv-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={editing.email}
              />
            </label>
            <label className="admin-edit-form__checkbox">
              <input
                type="checkbox"
                checked={editAdmin}
                disabled={editing.id === me?.id}
                onChange={(e) => setEditAdmin(e.target.checked)}
              />
              Admin access
              {editing.id === me?.id && <span className="admin-edit-form__hint"> (can't change your own)</span>}
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
        title="Deactivate this user?"
        message={
          pendingDelete
            ? `${pendingDelete.email} won't be able to sign in anymore. Their ${pendingDelete.prediction_count} predictions and ${pendingDelete.house_count} saved properties are kept, and you can restore the account any time from this list.`
            : ''
        }
        confirmLabel={busy ? 'Deactivating...' : 'Deactivate user'}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}
