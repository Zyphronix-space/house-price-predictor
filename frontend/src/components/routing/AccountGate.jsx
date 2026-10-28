import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'
import './AccountGate.css'

// Account-only pages that a guest can still reach from a link. Instead of
// bouncing them to /login (RequireAuth), this explains, in the page itself,
// what the account would give them here, and offers a way back to the
// parts of HomeValue that work without one. The API enforces the same
// rule independently: these endpoints answer 401 without a valid token.
export default function AccountGate({ title, benefit, children }) {
  const { user, authChecked } = useAuth()
  const { pathname } = useLocation()

  if (!authChecked) return null
  if (user) return children

  return (
    <section className="account-gate" aria-labelledby="account-gate-title">
      <p className="account-gate__eyebrow">Free account</p>
      <h1 id="account-gate-title" className="account-gate__title">{title}</h1>
      <p className="account-gate__copy">{benefit}</p>
      <div className="account-gate__actions">
        <Link to="/signup" state={{ from: pathname }} className="hv-btn hv-btn-primary">
          Create a free account
        </Link>
        <Link to="/login" state={{ from: pathname }} className="hv-btn hv-btn-secondary">
          Sign in
        </Link>
      </div>
      <p className="account-gate__alt">
        You don't need an account to <Link to="/predict">estimate an area</Link>,{' '}
        <Link to="/compare">compare areas</Link> or <Link to="/model-insights">read how the model works</Link>.
      </p>
    </section>
  )
}
