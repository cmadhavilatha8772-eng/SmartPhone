import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, isFirebaseConfigured } from '../firebase/firebase'
import { loginWithGoogle, registerUser } from '../services/authService'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    // Validate both password fields before sending a create-user request to Firebase.
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      await registerUser({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message || 'Google registration failed.')
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
            Add your Firebase web configuration values to the .env file before creating an account.
          </p>
          <Link to="/login" className="link-button secondary">
            Back to login
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
          <h2>Create your account</h2>
          <p>Start monitoring your device telemetry in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Name</span>
            <div className="input-wrap">
              <UserRound size={16} />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
          </label>

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
                placeholder="Minimum 6 characters"
                required
              />
            </div>
          </label>

          <label>
            <span>Confirm password</span>
            <div className="input-wrap">
              <LockKeyhole size={16} />
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
            {!loading ? <ArrowRight size={16} /> : null}
          </button>

          <button type="button" className="secondary-button" onClick={handleGoogleLogin} disabled={loading}>
            Continue with Google
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
