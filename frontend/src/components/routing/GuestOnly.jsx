import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'
import { safeReturnPath } from '../../lib/nav'

// Wraps public-only pages (login, signup, forgot/reset password) -- an
// already-signed-in user is sent on instead of seeing an auth form again:
// back to the page they came from (e.g. /predict, where their estimate is
// waiting) or else the dashboard. This also runs the moment sign-in
// succeeds, so it must agree with Login/Signup's own redirect.
export default function GuestOnly({ children }) {
  const { user, authChecked } = useAuth()
  const location = useLocation()

  if (!authChecked) return null
  if (user) return <Navigate to={safeReturnPath(location.state?.from) || '/dashboard'} replace />
  return children
}
