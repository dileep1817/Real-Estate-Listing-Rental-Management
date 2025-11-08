import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageGrid from '../components/ImageGrid'

export default function TenantSaved() {
  const navigate = useNavigate()
  const [savedHomes, setSavedHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastSavedId, setLastSavedId] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tenant_saved_homes')
      if (saved) setSavedHomes(JSON.parse(saved))
    } catch {}
    setLoading(false)
    try {
      const hint = localStorage.getItem('last_saved_id')
      if (hint) setLastSavedId(Number(hint))
      localStorage.removeItem('last_saved_id')
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('tenant_saved_homes', JSON.stringify(savedHomes)) } catch {}
  }, [savedHomes])

  function handleRemoveSaved(id) {
    setSavedHomes(prev => prev.filter(i => i.id !== id))
  }

  // Scroll to the just-saved item when arriving from Save action
  useEffect(() => {
    if (!lastSavedId || loading) return
    const el = document.getElementById(`saved-${lastSavedId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [lastSavedId, loading, savedHomes.length])

  function handleApply(item) {
    try {
      const raw = localStorage.getItem('tenant_active_apps')
      const apps = raw ? JSON.parse(raw) : []
      if (!apps.find(a => a.id === item.id)) {
        const next = [...apps, { ...item, status: 'pending' }]
        localStorage.setItem('tenant_active_apps', JSON.stringify(next))
      }
    } catch {}
    navigate(`/property/${item.id}`)
  }

  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>Saved Properties</h1>
      {loading && <div className="muted">Loading saved homes...</div>}
      {error && !loading && <div className="muted">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-3" style={{ marginTop: 12 }}>
          {savedHomes.length === 0 && (
            <div className="muted">No saved properties yet.</div>
          )}
          {savedHomes.map((item) => {
            const getProp = (obj, keys) => {
              for (const k of keys) {
                const v = obj && obj[k]
                if (v !== undefined && v !== null && String(v) !== '') return v
              }
              return ''
            }
            const type = (getProp(item, ['propertyType', 'type', 'category']) || '').toString()
            const txRaw = (getProp(item, ['transactionType', 'txType', 'for']) || '').toString().toLowerCase()
            const inferredTx = txRaw ? txRaw : (getProp(item, ['monthlyRent','rent','rentPrice']) ? 'rental' : 'sale')
            const priceVal = getProp(item, ['price','monthlyRent','rent','amount'])
            const priceText = priceVal ? (inferredTx === 'sale' ? `₹ ${priceVal}` : `₹ ${priceVal} / mo`) : ''
            const locationText = getProp(item, ['location','address','city']) || '—'
            const desc = getProp(item, ['description','details','summary','desc'])
            const images = (() => {
              const fromPhotos = Array.isArray(item?.photos) && item.photos.length ? item.photos : null
              const fromImages = Array.isArray(item?.images) && item.images.length ? item.images : null
              const fromImageUrls = Array.isArray(item?.imageUrls) && item.imageUrls.length ? item.imageUrls : null
              const single = typeof item?.photo === 'string' && item.photo ? [item.photo] : (typeof item?.coverPhoto === 'string' && item.coverPhoto ? [item.coverPhoto] : null)
              return (fromPhotos || fromImages || fromImageUrls || single) || [
                `https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop`,
                `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
                `https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop`,
              ]
            })()
            return (
              <div
                key={item.id}
                id={`saved-${item.id}`}
                className="card stack"
                style={lastSavedId === item.id ? { boxShadow: '0 0 0 3px #93c5fd, 0 8px 28px rgba(59,130,246,0.25)' } : undefined}
              >
                <ImageGrid
                  columns={3}
                  images={Array.isArray(images) && images.length ? images.slice(0,3) : images}
                />
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{item.title}</strong>
                  {priceText ? <span className="badge">{priceText}</span> : null}
                </div>
                <div className="muted">{locationText}</div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="badge">{type ? type.toUpperCase() : '—'}</span>
                  <span className="badge">{inferredTx === 'sale' ? 'SALE' : 'RENT'}</span>
                </div>
                {desc ? (
                  <p className="muted" style={{ marginTop: 6 }}>{String(desc).length > 140 ? `${String(desc).slice(0,140)}…` : desc}</p>
                ) : null}
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn" onClick={() => handleRemoveSaved(item.id)}>Remove</button>
                  <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                  <button className="btn" onClick={() => handleApply(item)}>Apply</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
