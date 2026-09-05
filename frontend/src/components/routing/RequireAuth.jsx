import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'

export default function RequireAuth({ children }) {
  const { user, authChecked } = useAuth()
  const location = useLocation()

  if (!authChecked) return null
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}
