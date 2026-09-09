import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../lib/auth'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await forgotPassword(email)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Reset your password" tagline="Enter your email and we'll help you reset it.">
      {!result ? (
        <form onSubmit={handleSubmit} className="auth-page__form">
          <label className="auth-page__field">
            <span className="hv-label">Email</span>
            <input
              className="hv-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          {error && <p className="auth-page__error">{error}</p>}

          <button type="submit" className="hv-btn hv-btn-primary auth-page__submit" disabled={loading} aria-busy={loading}>
            {loading && <span className="hv-spinner" aria-hidden="true" />}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      ) : (
        <div className="auth-page__result">
          <p className="auth-page__result-message">{result.message}</p>

          {result.reset_token && (
            <div className="auth-page__demo-banner">
              <p className="auth-page__demo-banner-title">Demo mode: no email service configured</p>
              <p className="auth-page__demo-banner-copy">
                In production this link would be emailed. For this project, here it is directly:
                the token is real, single-use, and expires in 30 minutes.
              </p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(result.reset_token)}`}
                className="hv-btn hv-btn-primary auth-page__submit"
              >
                Continue to reset password
              </Link>
            </div>
          )}
        </div>
      )}

      <p className="auth-page__switch">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  )
}
