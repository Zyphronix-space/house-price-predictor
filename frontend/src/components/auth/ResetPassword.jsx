import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../lib/auth'
import { showToast } from '../../lib/toast'
import AuthShell from './AuthShell'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  if (!token) {
    return (
      <AuthShell title="Invalid reset link">
        <p className="auth-page__result-message">
          This reset link is missing its token. Request a new one from the forgot-password page.
        </p>
        <p className="auth-page__switch">
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </AuthShell>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      showToast('Password reset, you can sign in now', 'success')
      setTimeout(() => navigate('/login', { replace: true }), 1600)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Password reset">
        <p className="auth-page__result-message">Your password has been reset. Redirecting to sign in…</p>
        <p className="auth-page__switch">
          <Link to="/login">Go to sign in now</Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={handleSubmit} className="auth-page__form">
        <label className="auth-page__field">
          <span className="hv-label">New password</span>
          <input
            className="hv-input"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>

        <label className="auth-page__field">
          <span className="hv-label">Confirm new password</span>
          <input
            className="hv-input"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
          />
        </label>

        {error && <p className="auth-page__error">{error}</p>}

        <button type="submit" className="hv-btn hv-btn-primary auth-page__submit" disabled={loading} aria-busy={loading}>
          {loading && <span className="hv-spinner" aria-hidden="true" />}
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  )
}
