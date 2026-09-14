import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'

// Sits inside RequireAuth (App.jsx), so `user` is always already set here
// -- this only adds the is_admin check on top. The backend enforces the
// same restriction independently on every /admin/* route (see
// get_current_admin in auth.py), so this is a UX redirect, not the actual
// security boundary.
export default function RequireAdmin({ children }) {
  const { user } = useAuth()
  if (!user?.is_admin) return <Navigate to="/dashboard" replace />
  return children
}
