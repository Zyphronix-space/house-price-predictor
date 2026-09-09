import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/authContext'
import { useTheme } from '../../lib/hooks'
import { getPreferences, setDensity, setMotionPreference, setToastErrorEnabled, setToastSuccessEnabled } from '../../lib/preferences'
import { downloadJson } from '../../lib/exportHistory'
import { showToast } from '../../lib/toast'
import ConfirmDialog from '../ConfirmDialog'
import './Account.css'

const TABS = ['General', 'Appearance', 'Notifications', 'Security', 'Privacy', 'Account']
const THEME_OPTIONS = ['system', 'light', 'dark']

export default function Settings() {
  const [tab, setTab] = useState('General')
  const { user, setUser, signOut } = useAuth()

  return (
    <section className="account-page">
      <p className="hv-label">Settings</p>
      <h1 className="account-page__title">Settings</h1>

      <div className="account-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`account-tab ${tab === t ? 'is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'General' && <GeneralTab user={user} setUser={setUser} />}
      {tab === 'Appearance' && <AppearanceTab />}
      {tab === 'Notifications' && <NotificationsTab />}
      {tab === 'Security' && <SecurityTab />}
      {tab === 'Privacy' && <PrivacyTab signOut={signOut} />}
      {tab === 'Account' && <AccountTab user={user} signOut={signOut} />}
    </section>
  )
}

function GeneralTab({ user, setUser }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [saving, setSaving] = useState(false)
  const dirty = displayName.trim() !== (user?.display_name || '')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.updateProfile({ display_name: displayName.trim() || null })
      setUser(updated)
      showToast('Settings saved', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
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
      <p className="account-hint">Signed in as {user?.email}.</p>
    </form>
  )
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState(getPreferences)

  return (
    <div className="account-card-stack">
      <div className="hv-card account-card">
        <p className="hv-label">Theme</p>
        <div className="account-pill-row">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`account-pill ${theme === opt ? 'is-active' : ''}`}
              onClick={() => setTheme(opt)}
            >
              {opt === 'system' ? 'System' : opt === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
        <p className="account-hint">"System" follows your OS light/dark setting automatically.</p>
      </div>

      <div className="hv-card account-card account-toggle-row">
        <div>
          <p className="account-toggle-label">Reduce motion</p>
          <p className="account-hint">Turns off animations and transitions app-wide, regardless of your OS setting.</p>
        </div>
        <label className="account-switch">
          <input
            type="checkbox"
            checked={prefs.motion === 'reduced'}
            onChange={(e) => {
              setMotionPreference(e.target.checked ? 'reduced' : 'auto')
              setPrefs(getPreferences())
            }}
          />
          <span className="account-switch__track" aria-hidden="true" />
        </label>
      </div>

      <div className="hv-card account-card account-toggle-row">
        <div>
          <p className="account-toggle-label">Compact mode</p>
          <p className="account-hint">Tightens navigation and spacing for denser layouts.</p>
        </div>
        <label className="account-switch">
          <input
            type="checkbox"
            checked={prefs.density === 'compact'}
            onChange={(e) => {
              setDensity(e.target.checked ? 'compact' : 'comfortable')
              setPrefs(getPreferences())
            }}
          />
          <span className="account-switch__track" aria-hidden="true" />
        </label>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState(getPreferences)

  return (
    <div className="account-card-stack">
      <div className="hv-card account-card account-toggle-row">
        <div>
          <p className="account-toggle-label">Success notifications</p>
          <p className="account-hint">Show a floating toast when an action succeeds (prediction saved, property added…).</p>
        </div>
        <label className="account-switch">
          <input
            type="checkbox"
            checked={prefs.toastSuccess}
            onChange={(e) => {
              setToastSuccessEnabled(e.target.checked)
              setPrefs(getPreferences())
            }}
          />
          <span className="account-switch__track" aria-hidden="true" />
        </label>
      </div>

      <div className="hv-card account-card account-toggle-row">
        <div>
          <p className="account-toggle-label">Error notifications</p>
          <p className="account-hint">Show a floating toast when something fails.</p>
        </div>
        <label className="account-switch">
          <input
            type="checkbox"
            checked={prefs.toastError}
            onChange={(e) => {
              setToastErrorEnabled(e.target.checked)
              setPrefs(getPreferences())
            }}
          />
          <span className="account-switch__track" aria-hidden="true" />
        </label>
      </div>

      <p className="account-hint">
        Every event is always logged in the notification center (the bell icon in the top bar);
        these switches only control the floating pop-up.
      </p>
    </div>
  )
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    setSaving(true)
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword })
      showToast('Password changed', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="account-card-stack">
      <form className="hv-card account-card" onSubmit={handleSubmit}>
        <p className="hv-label">Change password</p>
        <div className="account-form-stack">
          <input
            className="hv-input"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            className="hv-input"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            className="hv-input"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="account-error">{error}</p>}
        <button type="submit" className="hv-btn hv-btn-primary" disabled={saving} aria-busy={saving}>
          {saving && <span className="hv-spinner" aria-hidden="true" />}
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="hv-card account-card">
        <p className="hv-label">Sessions</p>
        <p className="account-hint">Signed-in sessions expire automatically after 7 days and are not tracked per device.</p>
      </div>
    </div>
  )
}

function PrivacyTab({ signOut }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  const handleExport = async () => {
    setExporting(true)
    try {
      const [houses, predictions] = await Promise.all([api.houses.list(), api.predictions.list()])
      downloadJson('homevalue-data-export.json', {
        exported_at: new Date().toISOString(),
        houses: houses.houses,
        predictions: predictions.predictions,
      })
      showToast('Data export downloaded', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="account-card-stack">
      <div className="hv-card account-card">
        <p className="hv-label">Export your data</p>
        <p className="account-hint">Download every saved property and prediction as a JSON file.</p>
        <button type="button" className="hv-btn hv-btn-secondary" onClick={handleExport} disabled={exporting} aria-busy={exporting}>
          {exporting && <span className="hv-spinner" aria-hidden="true" />}
          {exporting ? 'Preparing…' : 'Export my data'}
        </button>
      </div>

      <div className="hv-card account-card account-card--danger">
        <p className="hv-label">Delete account</p>
        <p className="account-hint">
          Permanently deletes your account, saved properties, and prediction history. This cannot
          be undone.
        </p>
        <button type="button" className="hv-btn account-danger-btn" onClick={() => setConfirmOpen(true)}>
          Delete my account
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        message="This permanently deletes your account, saved properties, and prediction history. This cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete account'}
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await api.deleteAccount()
            showToast('Account deleted', 'success')
            signOut()
            navigate('/', { replace: true })
          } catch (err) {
            showToast(err.message, 'error')
          } finally {
            setDeleting(false)
            setConfirmOpen(false)
          }
        }}
      />
    </div>
  )
}

function AccountTab({ user, signOut }) {
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="account-card-stack">
      <div className="hv-card account-card">
        <p className="hv-label">Email</p>
        <p className="account-value">{user.email}</p>
      </div>
      <div className="hv-card account-card">
        <p className="hv-label">Member since</p>
        <p className="account-value">
          {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="hv-card account-card">
        <p className="hv-label">Plan</p>
        <p className="account-value">Free, this is a portfolio project, no billing is implemented.</p>
      </div>
      <div className="hv-card account-card">
        <button
          type="button"
          className="hv-btn hv-btn-secondary"
          onClick={() => {
            signOut()
            navigate('/', { replace: true })
          }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}
