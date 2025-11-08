import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [persistStore, setPersistStore] = useState('local') // 'local' | 'session'

  useEffect(() => {
    // Load from sessionStorage first (non-remembered), then localStorage
    let raw = sessionStorage.getItem('auth:user')
    if (raw) {
      try { setUser(JSON.parse(raw)); setPersistStore('session') } catch {}
    } else {
      raw = localStorage.getItem('auth:user')
      if (raw) {
        try { setUser(JSON.parse(raw)); setPersistStore('local') } catch {}
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      const data = JSON.stringify(user)
      if (persistStore === 'session') {
        sessionStorage.setItem('auth:user', data)
        localStorage.removeItem('auth:user')
      } else {
        localStorage.setItem('auth:user', data)
        sessionStorage.removeItem('auth:user')
      }
    } else {
      localStorage.removeItem('auth:user')
      sessionStorage.removeItem('auth:user')
    }
  }, [user, persistStore])

  const login = async ({ email, role = 'tenant', remember = true, name }) => {
    await new Promise((r) => setTimeout(r, 300))
    setPersistStore(remember ? 'local' : 'session')
    setUser({ email, role, name: name && name.trim() ? name.trim() : email.split('@')[0] })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth:user')
    sessionStorage.removeItem('auth:user')
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
