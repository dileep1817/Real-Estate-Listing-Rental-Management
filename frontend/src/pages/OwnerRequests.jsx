import React, { useEffect, useMemo, useState } from 'react'
import ImageGrid from '../components/ImageGrid'
import { getRequests, setRequestStatus } from '../state'
import { updateListing } from '../api'

export default function OwnerRequests() {
  const [requests, setRequests] = useState([])
  const [selectedListingId, setSelectedListingId] = useState(null)

  useEffect(() => {
    // hydrate optional filter set from OwnerListings "View Requests"
    try {
      const filter = localStorage.getItem('owner_requests_filter')
      if (filter) setSelectedListingId(Number(filter))
      localStorage.removeItem('owner_requests_filter')
    } catch {}
  }, [])

  useEffect(() => {
    setRequests(getRequests())
    const i = setInterval(() => setRequests(getRequests()), 1000)
    return () => clearInterval(i)
  }, [])

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests])
  const filtered = useMemo(() => {
    if (!selectedListingId) return pending
    return pending.filter(r => r.listing?.id === selectedListingId)
  }, [pending, selectedListingId])

  async function acceptRequest(r) {
    const updated = setRequestStatus(r.id, 'accepted')
    if (updated) {
      try { await updateListing(r.listing.id, { booked: true }) } catch {}
      setRequests(getRequests())
    }
  }

  function rejectRequest(r) {
    const updated = setRequestStatus(r.id, 'rejected')
    if (updated) setRequests(getRequests())
  }

  return (
    <div className="container page" style={{ padding: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Pending Booking Requests</h1>
        <div className="row" style={{ gap: 8 }}>
          {selectedListingId && <button className="btn" onClick={() => setSelectedListingId(null)}>Clear Filter</button>}
        </div>
      </div>
      {filtered.length === 0 && <div className="muted">No requests {selectedListingId ? 'for this property' : 'yet'}.</div>}
      <div className="grid grid-3" style={{ marginTop: 12 }}>
        {filtered.map((r) => (
          <div key={r.id} className="card stack">
            <ImageGrid columns={3} images={[
              `https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
              `https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop`,
            ]} />
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{r.listing.title}</strong>
              <span className="badge">{r.status}</span>
            </div>
            <div className="muted">Tenant: {r.tenantEmail}</div>
            <div className="row">
              <button className="btn btn-primary" onClick={() => acceptRequest(r)} disabled={r.status !== 'pending'}>Accept</button>
              <button className="btn" onClick={() => rejectRequest(r)} disabled={r.status !== 'pending'}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
