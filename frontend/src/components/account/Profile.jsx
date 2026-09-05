import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/authContext'
import { showToast } from '../../lib/toast'
import './Account.css'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const dirty = displayName.trim() !== (user.display_name || '')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.updateProfile({ display_name: displayName.trim() || null })
      setUser(updated)
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const initials = (user.display_name?.trim() || user.email).slice(0, 1).toUpperCase()

  return (
    <section className="account-page">
      <p className="hv-label">Profile</p>
      <h1 className="account-page__title">Your account</h1>

      <div className="hv-glass account-card account-card--profile">
        <span className="account-avatar" aria-hidden="true">{initials}</span>
        <div className="account-identity">
          <p className="account-identity__name">{user.display_name || 'No name set'}</p>
          <p className="account-identity__email">{user.email}</p>
          <p className="account-identity__since">
            Member since {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <form className="hv-card account-card" onSubmit={handleSave}>
        <p className="hv-label">Display name</p>
        <div className="account-form-row">
          <input
            className="hv-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Add your name"
            maxLength={120}
          />
          <button type="submit" className="hv-btn hv-btn-primary" disabled={!dirty || saving} aria-busy={saving}>
            {saving && <span className="hv-spinner" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <p className="account-hint">Your email can't be changed from here — contact support if you need to update it.</p>
      </form>

      <p className="account-page__footer-link">
        Want to change your password or manage preferences? Go to <Link to="/settings">Settings</Link>.
      </p>
    </section>
  )
}
