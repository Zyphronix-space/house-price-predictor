import { useState } from 'react'
import { login, signup } from '../lib/auth'
import './AuthPage.css'

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = mode === 'login' ? await login(email, password) : await signup(email, password)
      onAuthenticated(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="hv-card auth-page__card">
        <p className="hv-label">Home Value</p>
        <h1 className="auth-page__headline">AI Real Estate Analytics</h1>
        <p className="auth-page__tagline">Sign in to save properties, run valuations, and track your prediction history.</p>

        <div className="auth-page__tabs">
          <button
            type="button"
            className={`auth-page__tab ${mode === 'login' ? 'is-active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-page__tab ${mode === 'signup' ? 'is-active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

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
            <input
              className="hv-input"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
            />
          </label>

          {error && <p className="auth-page__error">{error}</p>}

          <button type="submit" className="hv-btn hv-btn-primary auth-page__submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-page__switch">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')}>Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
