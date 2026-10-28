import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'
import './Marketing.css'
import { LogoMark } from '../icons'

export default function PublicNav() {
  const { user, authChecked } = useAuth()

  return (
    <header className="hv-topnav-wrap">
      <div className="hv-topnav">
        <Link to="/" className="hv-brand">
          <span className="hv-brand__mark" aria-hidden="true"><LogoMark width={20} height={20} /></span>
          <span className="hv-brand__word">
            Home<span className="hv-brand__accent">Value</span>
          </span>
        </Link>

        <nav className="hv-topnav__links" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `hv-topnav__link ${isActive ? 'is-active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/predict" className={({ isActive }) => `hv-topnav__link ${isActive ? 'is-active' : ''}`}>
            Estimate
          </NavLink>
          <NavLink to="/features" className={({ isActive }) => `hv-topnav__link ${isActive ? 'is-active' : ''}`}>
            Features
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `hv-topnav__link ${isActive ? 'is-active' : ''}`}>
            About
          </NavLink>
        </nav>

        <div className="hv-topnav__meta">
          {authChecked && user ? (
            <Link to="/dashboard" className="hv-btn hv-btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hv-btn hv-btn-ghost">
                Sign in
              </Link>
              <Link to="/predict" className="hv-btn hv-btn-primary">
                Estimate an area
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
