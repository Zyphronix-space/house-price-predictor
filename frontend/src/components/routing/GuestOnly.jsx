import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'

// Wraps public-only pages (login, signup, forgot/reset password) -- an
// already-signed-in user is sent straight to the dashboard instead of
// seeing an auth form again.
export default function GuestOnly({ children }) {
  const { user, authChecked } = useAuth()

  if (!authChecked) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
