import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'
import './NotFound.css'

export default function NotFound() {
  const { user } = useAuth()

  return (
    <div className="hv-app">
      <div className="hv-ambient" aria-hidden="true">
        <span className="hv-ambient__blob hv-ambient__blob--a" />
        <span className="hv-ambient__blob hv-ambient__blob--b" />
        <span className="hv-ambient__blob hv-ambient__blob--c" />
      </div>
      <main className="not-found">
        <div className="hv-glass not-found__card">
          <p className="hv-label">404</p>
          <h1 className="not-found__title">This page doesn't exist.</h1>
          <p className="not-found__copy">The link may be broken, or the page may have moved.</p>
          <Link to={user ? '/dashboard' : '/'} className="hv-btn hv-btn-primary">
            {user ? 'Back to dashboard' : 'Back home'}
          </Link>
        </div>
      </main>
    </div>
  )
}
