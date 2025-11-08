import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getListings, deleteListing } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import ImageGrid from '../components/ImageGrid'

export default function OwnerProperties() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getListings()
        if (!active) return
        const mine = data.filter(l => (l.ownerName || 'Owner') === (user?.name || 'Owner'))
        setListings(mine)
      } catch (e) {
        if (active) setError('Failed to load properties')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [user])

  async function removeListing(id) {
    try {
      await deleteListing(id)
      setListings(prev => prev.filter(l => l.id !== id))
    } catch (e) {
      alert(`Failed to delete: ${e.message || e}`)
    }
  }

  return (
    <div className="container" style={{ padding: 24 }}>
      <div className="row" style={{ justifyContent:'space-between' }}>
        <h1>My Properties</h1>
        <Link to="/owner/properties/new" className="btn btn-primary">Add Property</Link>
      </div>

      {loading && <div className="muted">Loading...</div>}
      {error && !loading && <div className="muted">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-3" style={{ marginTop: 12 }}>
          {listings.map((l) => (
            <div key={l.id} className="card stack">
              <ImageGrid columns={3} images={l.photos && l.photos.length ? l.photos.slice(0,3) : [
                'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop',
              ]} />
              <div className="row" style={{ justifyContent:'space-between' }}>
                <strong>{l.title}</strong>
                <span className="badge">{l.transactionType==='sale' ? `₹ ${l.price}` : `₹ ${l.price} / mo`}</span>
              </div>
              <div className="muted">{l.location || '—'}</div>
              <div className="row" style={{ gap: 8 }}>
                <Link to={`/property/${l.id}`} className="btn">View</Link>
                <Link to={`/owner/properties/${l.id}/edit`} className="btn btn-primary">Edit</Link>
                <button className="btn" onClick={() => removeListing(l.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
