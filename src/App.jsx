import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { auth } from './firebase/firebase'
import Loading from './components/Loading'
import { logoutUser } from './services/authService'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Login from './pages/Login'
import MapPage from './pages/Map'
import Register from './pages/Register'
import Settings from './pages/Settings'
import TelemetryPage from './pages/Telemetry'

function AppLayout({ user, children, theme, onToggleTheme, onLogout }) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <Sidebar user={user} onLogout={onLogout} />
      <div className="page-shell">
        <Navbar user={user} onLogout={onLogout} onToggleTheme={onToggleTheme} theme={theme} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('telemetry-theme') || 'dark')

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('telemetry-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!auth) {
      setUser(null)
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
  }

  if (loading) {
    return <Loading message="Checking authentication..." />
  }

  return (
    <div className={`page-root theme-${theme}`}>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <AppLayout user={user} theme={theme} onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} onLogout={handleLogout}>
                <Dashboard user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/devices"
          element={
            <ProtectedRoute user={user}>
              <AppLayout user={user} theme={theme} onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} onLogout={handleLogout}>
                <Devices user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/telemetry"
          element={
            <ProtectedRoute user={user}>
              <AppLayout user={user} theme={theme} onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} onLogout={handleLogout}>
                <TelemetryPage user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute user={user}>
              <AppLayout user={user} theme={theme} onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} onLogout={handleLogout}>
                <MapPage user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user}>
              <AppLayout user={user} theme={theme} onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} onLogout={handleLogout}>
                <Settings user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </div>
  )
}

export default App
