import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { auth } from './firebase/firebase'
import Loading from './components/Loading'
import { logoutUser } from './services/authService'
import { trackUserActivity } from './services/activityTrackingService'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const UserActivity = lazy(() => import('./pages/UserActivity'))
const Devices = lazy(() => import('./pages/Devices'))
const Login = lazy(() => import('./pages/Login'))
const MapPage = lazy(() => import('./pages/Map'))
const Register = lazy(() => import('./pages/Register'))
const Settings = lazy(() => import('./pages/Settings'))
const TelemetryPage = lazy(() => import('./pages/Telemetry'))

function AppLayout({ user, children, theme, onToggleTheme, onLogout, isAdmin, activityError }) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <Sidebar user={user} onLogout={onLogout} isAdmin={isAdmin} />
      <div className="page-shell">
        <Navbar user={user} onLogout={onLogout} onToggleTheme={onToggleTheme} theme={theme} />
        <main className="page-content">
          {activityError ? <div className="error-box" role="alert">{activityError}</div> : null}
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adminState, setAdminState] = useState({ userId: null, isAdmin: false })
  const [activityError, setActivityError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('telemetry-theme') || 'dark')
  const isAdmin = !user
    ? false
    : adminState.userId === user.uid
      ? adminState.isAdmin
      : null

  useEffect(() => {
    document.body.dataset.theme = theme
    // Keep the selected theme across reloads and make it available to global CSS.
    localStorage.setItem('telemetry-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!auth) {
      setUser(null)
      setLoading(false)
      return undefined
    }

    // Firebase emits the current session immediately, then notifies us of later auth changes.
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return undefined

    return trackUserActivity(user.uid, (error) => {
      setActivityError(error?.message || '')
    })
  }, [user])

  useEffect(() => {
    let cancelled = false
    if (!user) return undefined

    getIdTokenResult(user)
      .then((token) => {
        if (!cancelled) {
          setAdminState({ userId: user.uid, isAdmin: token.claims.admin === true })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAdminState({ userId: user.uid, isAdmin: false })
          setActivityError(error.message || 'Unable to verify administrator access.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      window.alert(error.message || 'Unable to record logout activity.')
    }
  }

  const createLayout = (children) => (
    <AppLayout
      user={user}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      onLogout={handleLogout}
      isAdmin={isAdmin}
      activityError={activityError}
    >
      {children}
    </AppLayout>
  )

  if (loading) {
    return <Loading message="Checking authentication..." />
  }

  return (
    <div className={`page-root theme-${theme}`}>
      <Suspense fallback={<Loading message="Loading page..." />}>
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                {createLayout(<Dashboard user={user} />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/devices"
            element={
              <ProtectedRoute user={user}>
                {createLayout(<Devices user={user} />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/telemetry"
            element={
              <ProtectedRoute user={user}>
                {createLayout(<TelemetryPage user={user} />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/map"
            element={
              <ProtectedRoute user={user}>
                {createLayout(<MapPage user={user} />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user}>
                {createLayout(<Settings user={user} />)}
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute user={user}>
                {isAdmin
                  ? createLayout(<UserActivity />)
                  : isAdmin === null
                    ? <Loading message="Verifying administrator access..." />
                    : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
