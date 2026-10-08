import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, isFirebaseConfigured } from '../firebase/firebase'
import { loginUser, loginWithGoogle } from '../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginUser(form)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message || 'Google sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!auth || !isFirebaseConfigured) {
    return (
      <div className="auth-layout">
        <div className="auth-card setup-card">
          <div className="auth-header">
            <div className="brand-badge">
              <Sparkles size={18} />
            </div>
            <h2>Firebase setup required</h2>
          </div>
          <p className="setup-copy">
            Add your Firebase web configuration values to the .env file before starting the dashboard.
          </p>
          <Link to="/register" className="link-button secondary">
            View registration page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">
            <Sparkles size={18} />
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to access your smartphone telemetry dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={16} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
            {!loading ? <ArrowRight size={16} /> : null}
          </button>

          <button type="button" className="secondary-button" onClick={handleGoogleLogin} disabled={loading}>
            Continue with Google
          </button>
        </form>

        <p className="auth-switch">
          Need an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  )
}
