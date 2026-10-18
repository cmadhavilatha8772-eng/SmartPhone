import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ user, children }) {
  // Replace the protected URL so unauthenticated users cannot navigate back into it.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
