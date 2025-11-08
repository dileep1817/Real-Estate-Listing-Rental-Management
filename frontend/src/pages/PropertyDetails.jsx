import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageGrid from '../components/ImageGrid'
import MapEmbed from '../components/MapEmbed'
import { getListing, deleteListing } from '../api'
import { addRequest, sendMessage } from '../state'
import { useAuth } from '../context/AuthContext.jsx'

export default function PropertyDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const isOwner = user?.role === 'owner'

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getListing(id)
        if (active) setItem(data)
      } catch (e) {
        if (active) setError('Failed to load property')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!item) return
    try {
      const raw = localStorage.getItem('tenant_saved_homes')
      const arr = raw ? JSON.parse(raw) : []
      setSaved(!!arr.find((a) => a.id === item.id))
    } catch {}
  }, [item])

  function addToActiveApplications(listing) {
    try {
      const raw = localStorage.getItem('tenant_active_apps')
      const arr = raw ? JSON.parse(raw) : []
      if (!arr.find(a => a.id === listing.id)) {
        arr.push({ ...listing, status: 'pending' })
        localStorage.setItem('tenant_active_apps', JSON.stringify(arr))
      }
    } catch {}
  }

  function handleRequestBooking() {
    if (!item) return
    addToActiveApplications(item)
    addRequest({ listing: item, tenantEmail: user?.email || 'tenant@example.com' })
    sendMessage({
      fromRole: 'tenant',
      toRole: 'owner',
      text: `Booking requested for "${item.title}"`,
      listingId: item.id,
      ownerName: item.ownerName || 'Owner',
      tenantEmail: user?.email || 'tenant@example.com',
      tenantName: user?.name
    })
    // Hint TenantDashboard to open Active Applications, then navigate
    try { localStorage.setItem('tenant_nav_next_tab', 'applications') } catch {}
    navigate('/tenant')
  }

  function handleSave() {
    if (!item || saved) return
    try {
      const raw = localStorage.getItem('tenant_saved_homes')
      const arr = raw ? JSON.parse(raw) : []
      if (!arr.find((a) => a.id === item.id)) {
        const next = [...arr, item]
        localStorage.setItem('tenant_saved_homes', JSON.stringify(next))
      }
      setSaved(true)
      // Stay on this page; no redirect after saving
    } catch {
      setSaved(true)
      // Stay on this page; no redirect after saving
    }
  }

  async function handleDeleteListing() {
    if (!item) return
    const ok = window.confirm('Delete this listing?')
    if (!ok) return
    try {
      await deleteListing(item.id)
      navigate('/owner/properties')
    } catch (e) {
      alert('Failed to delete listing')
    }
  }
  return (
    <div style={{ padding: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>{item?.title || `Property Details #${id}`}</h1>
        {item?.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
      </div>

      <div className="grid grid-3 section">
        <div className="card stack" style={{ gridColumn: 'span 2' }}>
          <ImageGrid
            columns={3}
            images={(item?.photos && item.photos.length ? item.photos : [
              `https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop`,
            ])}
          />
          {loading && <div className="muted">Loading...</div>}
          {error && !loading && <div className="muted">{error}</div>}
          {item && !loading && !error && (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{item.title}</strong>
                {item.booked ? <span className="badge">Booked</span> : null}
                <span className="badge">{item.transactionType === 'sale' ? `₹ ${item.price}` : `₹ ${item.price} / mo`}</span>
              </div>
              <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location || 'Location not specified'}</div>
              <p>{item.description || 'No description provided.'}</p>
              <div className="row">
                {isOwner ? (
                  <>
                    <button className="btn btn-primary" onClick={() => navigate(`/owner/properties/${item.id}/edit`)}>Edit</button>
                    <button className="btn" onClick={handleDeleteListing}>Delete</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={handleRequestBooking} disabled={!!item.booked}>Request Booking</button>
                    <button className="btn" onClick={handleSave} disabled={saved}>{saved ? 'Saved' : 'Save'}</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <div className="card stack">
          <strong>Highlights</strong>
          <ul className="muted" style={{ margin: 0 }}>
            <li>East-facing, abundant natural light</li>
            <li>Covered parking for 2 cars</li>
            <li>24/7 security and power backup</li>
            <li>Gym, Pool, Children’s play area</li>
          </ul>
          {isOwner ? (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-primary" onClick={() => navigate(`/owner/properties/${item.id}/edit`)}>Edit</button>
              <button className="btn" onClick={handleDeleteListing}>Delete</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleRequestBooking}>Request Booking</button>
          )}
        </div>
      </div>

      <section className="section">
        <h2>Location</h2>
        <MapEmbed query={item?.location || 'Bengaluru, India'} height={320} zoom={14} />
      </section>
    </div>
  )
}

