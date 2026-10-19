import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, ready, user } = useAuth()
  if (!ready) return <div className="auth-loading">Checking your session…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/account" replace />
  return <Outlet />
}
