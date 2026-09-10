import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../lib/auth'
import { useAuth } from '../../lib/authContext'
import { showToast } from '../../lib/toast'
import { EyeIcon, EyeOffIcon } from '../icons'
import AuthShell from './AuthShell'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login(email, password)
      signIn(data, rememberMe)
      showToast('Signed in successfully', 'success')
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" tagline="Sign in to continue to your dashboard.">
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

        <label className="auth-page__field">
          <span className="hv-label">Password</span>
          <div className="auth-page__password-control">
            <input
              className="hv-input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
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

        <div className="auth-page__row">
          <label className="auth-page__checkbox">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="auth-page__link">
            Forgot password?
          </Link>
        </div>

        {error && <p className="auth-page__error">{error}</p>}

        <button type="submit" className="hv-btn hv-btn-primary auth-page__submit" disabled={loading} aria-busy={loading}>
          {loading && <span className="hv-spinner" aria-hidden="true" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-page__switch">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </AuthShell>
  )
}
