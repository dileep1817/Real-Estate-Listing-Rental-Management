import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ImageGrid from '../components/ImageGrid'
import { getListing } from '../api'

export default function TenantApplications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [appsHydrated, setAppsHydrated] = useState(false)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const apps = localStorage.getItem('tenant_active_apps')
      if (apps) setApplications(JSON.parse(apps))
    } catch {}
    setAppsHydrated(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!appsHydrated) return
    localStorage.setItem('tenant_active_apps', JSON.stringify(applications))
  }, [applications, appsHydrated])

  // Poll for updates while page is open
  useEffect(() => {
    const i = setInterval(async () => {
      try {
        const raw = localStorage.getItem('tenant_active_apps')
        const apps = raw ? JSON.parse(raw) : []
        // Refresh availability from backend for each application
        const refreshed = await Promise.all(apps.map(async (a) => {
          try {
            const latest = await getListing(a.id)
            return { ...a, booked: !!latest.booked, price: latest.price, title: latest.title, transactionType: latest.transactionType, location: latest.location }
          } catch {
            return a
          }
        }))
        setApplications(refreshed)
        localStorage.setItem('tenant_active_apps', JSON.stringify(refreshed))
      } catch {}
    }, 3000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>Applications</h1>
      {applications.length === 0 && <div className="muted">No active applications yet.</div>}
      <div className="grid grid-3" style={{ marginTop: 12 }}>
        {applications.map((a) => (
          <div key={a.id} className="card stack">
            <ImageGrid columns={3} images={Array.isArray(a.photos) && a.photos.length ? a.photos.slice(0,3) : [
              `https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
            ]} />
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{a.title}</strong>
              <span className="badge">{a.booked ? 'Booked' : 'Available'}</span>
            </div>
            <div className="muted">{a.transactionType === 'sale' ? `₹ ${a.price}` : `₹ ${a.price} / mo`} • {a.location || '—'}</div>
            <Link to={`/property/${a.id}`} className="btn btn-primary">View Details</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
