import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RoleProtectedRoute({ children, allow = [] }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (allow.length && !allow.includes(user.role)) return <Navigate to="/" replace />
  return children
}
