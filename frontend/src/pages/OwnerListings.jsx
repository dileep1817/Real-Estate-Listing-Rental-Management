import React, { useEffect, useMemo, useState } from 'react'
import ImageGrid from '../components/ImageGrid'
import { getListings, updateListing } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function OwnerListings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', price: '', location: '', description: '', ownerName: '' })

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getListings()
        setListings(data)
      } catch {}
    })()
  }, [])

  function startEdit(l) {
    setEditingId(l.id)
    setEditForm({
      title: l.title || '',
      price: l.price || '',
      location: l.location || '',
      description: l.description || '',
      ownerName: l.ownerName || (user?.name || 'Owner')
    })
  }

  function normalizeEditForm(f) { return { ...f, price: Number(f.price) || 0 } }

  function saveEdit(id) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...normalizeEditForm(editForm) } : l))
    setEditingId(null)
    try { updateListing(id, normalizeEditForm(editForm)) } catch {}
  }

  function cancelEdit() { setEditingId(null) }

  function viewRequestsFor(listingId) {
    try { localStorage.setItem('owner_requests_filter', String(listingId)) } catch {}
    navigate('/owner/requests')
  }

  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>My Properties</h1>
      {listings.length === 0 && <div className="muted">No listings available.</div>}
      <div className="grid grid-3" style={{ marginTop: 12 }}>
        {listings.map(l => (
          <div key={l.id} className="card stack">
            <ImageGrid columns={3} images={[
              `https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop`,
            ]} />
            {editingId === l.id ? (
              <>
                <div className="stack">
                  <input className="input" placeholder="Title" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                  <input className="input" placeholder="Price" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                  <input className="input" placeholder="Location" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                  <textarea className="input" placeholder="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn" onClick={cancelEdit}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => saveEdit(l.id)}>Save</button>
                </div>
              </>
            ) : (
              <>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{l.title}</strong>
                  <span className="badge">₹ {l.price} / mo</span>
                </div>
                <div className="muted">{l.location || '—'}</div>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => startEdit(l)}>Edit</button>
                  <button className="btn" onClick={() => viewRequestsFor(l.id)}>View Requests</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
