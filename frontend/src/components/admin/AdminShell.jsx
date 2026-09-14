import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'
import { OverviewIcon, UsersIcon, HomeIcon, DocumentIcon, ArrowLeftIcon } from '../icons'
import './Admin.css'

// Deliberately NOT nested in the regular <AppShell>/<Layout> -- an admin
// panel owns the whole viewport (its own sidebar, its own way back to the
// real app) rather than being sandwiched inside the customer-facing nav
// and footer. See App.jsx: this sits in its own top-level route group.
const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: OverviewIcon, end: true },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/properties', label: 'Properties', icon: HomeIcon },
  { to: '/admin/predictions', label: 'Predictions', icon: DocumentIcon },
]

export default function AdminShell() {
  const { user } = useAuth()

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand">
          <span className="hv-brand__mark" aria-hidden="true">HV</span>
          <div>
            <span className="admin-shell__brand-name">HomeValue</span>
            <span className="admin-shell__brand-badge">Admin</span>
          </div>
        </div>

        <nav className="admin-shell__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-shell__nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon className="admin-shell__nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-shell__footer">
          <p className="admin-shell__signed-in">
            Signed in as
            <br />
            <strong>{user?.display_name || user?.email}</strong>
          </p>
          <NavLink to="/dashboard" className="admin-shell__exit">
            <ArrowLeftIcon width={15} height={15} />
            Back to app
          </NavLink>
        </div>
      </aside>

      <main className="admin-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
