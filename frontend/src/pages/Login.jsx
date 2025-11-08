import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProfileName } from '../state'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('tenant')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEmailValid = (v) => /.+@.+\..+/.test(v)
  const isFormValid = isEmailValid(email) && password.length >= 6

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!email || !password) throw new Error('Email and password are required')
      if (!isEmailValid(email)) throw new Error('Enter a valid email address')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      const name = getProfileName(email)
      await login({ email, password, role, remember, name })
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: '30px auto' }}>
      <div className="auth-card" style={{ margin: '0 auto' }}>
          <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
          <div className="muted" style={{ marginBottom: 16 }}>Sign in to continue to your dashboard</div>
          
          {error ? (<div className="error" style={{ marginBottom: 12 }}>{error}</div>) : null}
          <form onSubmit={onSubmit} className="form">
            <div className="form-group">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {!email || isEmailValid(email) ? null : (<div className="muted" style={{ color:'#b00020' }}>Invalid email</div>)}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <label className="muted" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
                  Show password
                </label>
                {password && password.length < 6 ? (<span className="muted" style={{ color:'#b00020' }}>Min 6 characters</span>) : null}
              </div>
            </div>
            <div className="form-group">
              <label>Select role</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="tenant">Tenant</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="row" style={{ justifyContent:'space-between' }}>
              <label className="muted" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link to="#" className="nav-link" style={{ padding:0 }}>Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading || !isFormValid} className="btn btn-primary">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          <div style={{ marginTop: 12 }}>
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </div>
        </div>
    </div>
  )
}
