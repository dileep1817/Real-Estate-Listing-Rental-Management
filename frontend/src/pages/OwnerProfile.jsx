import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getRequests } from '../state'

export default function OwnerProfile() {
  const { user, login } = useAuth()
  const email = user?.email || 'owner@example.com'
  const [name, setName] = useState(user?.name || 'Owner')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [summaryFilter, setSummaryFilter] = useState('') // '', 'all', 'pending', 'accepted', 'rejected'

  const profileKey = `profile:${email}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(profileKey)
      if (raw) {
        const p = JSON.parse(raw)
        if (p.name) setName(p.name)
        if (p.phone) setPhone(p.phone)
        if (p.avatar) setAvatar(p.avatar)
      }
    } catch {}
  }, [profileKey])

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setAvatar(reader.result) }
    reader.readAsDataURL(file)
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setShowCamera(true)
    } catch {}
  }

  function stopCamera() {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(v, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    setAvatar(dataUrl)
    stopCamera()
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const data = { name, phone, avatar }
      localStorage.setItem(profileKey, JSON.stringify(data))
      if (user?.email) {
        await login({ email: user.email, role: user.role, remember: true, name })
      }
    } catch {}
    setSaving(false)
  }

  // Stats: requests addressed to this owner
  const ownerKey = name || 'Owner'
  const requests = getRequests().filter(r => (r.listing?.ownerName || 'Owner') === ownerKey)
  const total = requests.length
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const accepted = requests.filter(r => r.status === 'accepted')
  const rejectedCount = requests.filter(r => r.status === 'rejected').length
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length
  const sales = accepted.filter(r => (r.listing?.transactionType || '') === 'sale')
  const rentals = accepted.filter(r => (r.listing?.transactionType || '') === 'rental')

  // Filtered requests for summary click-through
  const filteredRequests = (
    summaryFilter === 'all' ? requests :
    summaryFilter === 'pending' ? requests.filter(r => r.status === 'pending') :
    summaryFilter === 'accepted' ? requests.filter(r => r.status === 'accepted') :
    summaryFilter === 'rejected' ? requests.filter(r => r.status === 'rejected') :
    []
  )

  // Per-listing breakdown
  const byListing = (() => {
    const map = new Map()
    for (const r of requests) {
      const key = r.listing?.title || `Listing #${r.listing?.id || '—'}`
      const curr = map.get(key) || { total: 0, pending: 0, accepted: 0, rejected: 0, cancelled: 0 }
      curr.total += 1
      curr[r.status] = (curr[r.status] || 0) + 1
      map.set(key, curr)
    }
    return Array.from(map.entries()).map(([title, counts]) => ({ title, ...counts }))
  })()

  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>Profile</h1>
      <div className="grid grid-3 section">
        <div className="card stack" style={{ gridColumn: 'span 1', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 128, height: 128, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-elev-1)' }}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="muted" style={{ lineHeight: '128px' }}>No Photo</div>
            )}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <label className="btn">
              Upload
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </label>
            {!showCamera ? (
              <button className="btn" onClick={startCamera}>Use Camera</button>
            ) : (
              <button className="btn" onClick={stopCamera}>Close Camera</button>
            )}
          </div>
          {showCamera && (
            <div className="stack" style={{ alignItems: 'center' }}>
              <video ref={videoRef} style={{ width: '100%', borderRadius: 12 }} />
              <button className="btn btn-primary" onClick={capturePhoto}>Capture</button>
            </div>
          )}
        </div>

        <div className="card stack" style={{ gridColumn: 'span 2' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{name || 'Owner'}</strong>
            <span className="badge">Owner</span>
          </div>
          <div className="muted" style={{ marginBottom: 8 }}>{email}</div>
          <div className="row" style={{ gap: 8 }}>
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </div>

      

      {/* Summary sections moved to bottom */}
      {/* Interactive summary with filter */}
      
      <section className="section">
        <div className="card stack">
          <strong>Requests Summary</strong>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr onClick={() => setSummaryFilter('all')} style={{ cursor: 'pointer' }}>
                  <td>Total</td><td style={{ textAlign: 'right' }}>{total}</td>
                </tr>
                <tr onClick={() => setSummaryFilter('pending')} style={{ cursor: 'pointer' }}>
                  <td>Pending</td><td style={{ textAlign: 'right' }}>{pendingCount}</td>
                </tr>
                <tr onClick={() => setSummaryFilter('accepted')} style={{ cursor: 'pointer' }}>
                  <td>Accepted</td><td style={{ textAlign: 'right' }}>{accepted.length}</td>
                </tr>
                <tr onClick={() => setSummaryFilter('rejected')} style={{ cursor: 'pointer' }}>
                  <td>Rejected</td><td style={{ textAlign: 'right' }}>{rejectedCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {summaryFilter && (
        <section className="section">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>Requests: {summaryFilter.charAt(0).toUpperCase() + summaryFilter.slice(1)}</h2>
            <button className="btn" onClick={() => setSummaryFilter('')}>Clear</button>
          </div>
          <div className="grid grid-3" style={{ marginTop: 12 }}>
            {filteredRequests.map(r => (
              <div key={r.id} className="card stack">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{r.listing?.title || `Request #${r.id}`}</strong>
                  <span className="badge">{(r.status || '').toUpperCase()}</span>
                </div>
                <div className="muted">{(r.listing?.transactionType || '').toUpperCase()} • {r.listing?.location || '—'}</div>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted">{r.tenantEmail}</span>
                  <span className="badge">{(r.listing?.transactionType || '') === 'sale' ? `₹ ${r.listing?.price}` : `₹ ${r.listing?.price} / mo`}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="card stack">
          <strong>Requests by Listing</strong>
          <div style={{ overflow: 'auto', maxHeight: 320 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Listing</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Pending</th>
                  <th style={{ textAlign: 'right' }}>Accepted</th>
                  <th style={{ textAlign: 'right' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {byListing.map(row => (
                  <tr key={row.title}>
                    <td>{row.title}</td>
                    <td style={{ textAlign: 'right' }}>{row.total}</td>
                    <td style={{ textAlign: 'right' }}>{row.pending}</td>
                    <td style={{ textAlign: 'right' }}>{row.accepted}</td>
                    <td style={{ textAlign: 'right' }}>{row.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
