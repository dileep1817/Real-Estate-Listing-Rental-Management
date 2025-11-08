import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { setProfile } from '../state'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('tenant')
  const [showPwd, setShowPwd] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEmailValid = (v) => /.+@.+\..+/.test(v)
  const isFormValid =
    name.trim().length > 1 &&
    isEmailValid(email) &&
    password.length >= 6 &&
    password === confirm &&
    agree

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isFormValid) {
      setError('Please fill the form correctly')
      return
    }
    setLoading(true)
    try {
      await new Promise((res) => setTimeout(res, 600))
      // Save profile for name lookup in messages
      setProfile(email, name)
      // Auto-login and redirect to role dashboard (preserve full name)
      await login({ email, role, remember: true, name })
      navigate(role === 'owner' ? '/owner' : '/tenant', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: '30px auto' }}>
      <div className="auth-card" style={{ margin: '0 auto' }}>
          <h2 style={{ marginBottom: 6 }}>Create account</h2>
          <div className="muted" style={{ marginBottom: 16 }}>It only takes a minute to get started</div>
          
          {error ? (<div className="error" style={{ marginBottom: 12 }}>{error}</div>) : null}
          <form onSubmit={onSubmit} className="form">
            <div className="form-group">
              <label>Full name</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
              {name.trim().length > 1 ? null : (<div className="muted" style={{ color:'#b00020' }}>Please enter your full name</div>)}
            </div>
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
              <label>Confirm password</label>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
              {confirm && confirm !== password ? (<div className="muted" style={{ color:'#b00020' }}>Passwords do not match</div>) : null}
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
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                I agree to the Terms & Privacy
              </label>
            </div>
            <button type="submit" disabled={loading || !isFormValid} className="btn btn-primary">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div style={{ marginTop: 12 }}>
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
    </div>
  )
}
