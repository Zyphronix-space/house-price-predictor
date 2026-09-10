import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../lib/auth'
import { useAuth } from '../../lib/authContext'
import { showToast } from '../../lib/toast'
import { EyeIcon, EyeOffIcon } from '../icons'
import AuthShell from './AuthShell'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const data = await signup(email, password, name.trim())
      signIn(data, true)
      showToast('Account created. Welcome aboard.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" tagline="Start predicting, comparing, and analyzing property values.">
      <form onSubmit={handleSubmit} className="auth-page__form">
        <label className="auth-page__field">
          <span className="hv-label">Name</span>
          <input
            className="hv-input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
          />
        </label>

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

        <label className="auth-page__field">
          <span className="hv-label">Password</span>
          <div className="auth-page__password-control">
            <input
              className="hv-input"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              className="auth-page__password-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </label>

        <label className="auth-page__field">
          <span className="hv-label">Confirm password</span>
          <input
            className="hv-input"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
          />
        </label>

        <label className="auth-page__checkbox">
          <input
            type="checkbox"
            required
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span>
            I agree to the <Link to="/terms">Terms and Conditions</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>
          </span>
        </label>

        {error && <p className="auth-page__error">{error}</p>}

        <button type="submit" className="hv-btn hv-btn-primary auth-page__submit" disabled={loading} aria-busy={loading}>
          {loading && <span className="hv-spinner" aria-hidden="true" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-page__switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  )
}
