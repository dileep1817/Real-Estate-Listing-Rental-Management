import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageGrid from '../components/ImageGrid'
import MapEmbed from '../components/MapEmbed'
import { getListings } from '../api'
import { addRequest, sendMessage } from '../state'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const [selectedType, setSelectedType] = useState('')
  const [txFilter, setTxFilter] = useState('') // ''=All, 'rental', 'sale'
  const [landCatFilter, setLandCatFilter] = useState('') // only for land: ''=All, 'commercial', 'farming'
  const [selectedItem, setSelectedItem] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const raw = localStorage.getItem('favorites_ids')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('tenant_saved_homes')
      const arr = raw ? JSON.parse(raw) : []
      return arr.map((a) => a.id)
    } catch { return [] }
  })

  const [mapSearch, setMapSearch] = useState('')
  const [mapQuery, setMapQuery] = useState('Bengaluru, India')
  const [activeLocationFilter, setActiveLocationFilter] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getListings()
        if (active) setListings([...(data||[])].sort((a,b) => (b.id||0) - (a.id||0)))
      } catch (e) {
        if (active) setError('Failed to load listings')
      } finally {
        if (active) setLoading(false)
      }
    })()
    const timer = setInterval(async () => {
      try {
        const data = await getListings()
        if (active) setListings([...(data||[])].sort((a,b) => (b.id||0) - (a.id||0)))
      } catch {}
    }, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [])

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

  function handleRequestBookingFromModal() {
    if (!selectedItem) return
    addToActiveApplications(selectedItem)
    addRequest({ listing: selectedItem, tenantEmail: user?.email || 'tenant@example.com' })
    sendMessage({
      fromRole: 'tenant',
      toRole: 'owner',
      text: `Booking requested for "${selectedItem.title}"`,
      listingId: selectedItem.id,
      ownerName: selectedItem.ownerName || 'Owner',
      tenantEmail: user?.email || 'tenant@example.com',
      tenantName: user?.name
    })
    try { localStorage.setItem('tenant_nav_next_tab', 'applications') } catch {}
    setSelectedItem(null)
    navigate('/tenant')
  }

  function handleToggleFavorite(id) {
    setFavoriteIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem('favorites_ids', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function handleToggleSaved(item) {
    try {
      const raw = localStorage.getItem('tenant_saved_homes')
      const arr = raw ? JSON.parse(raw) : []
      const exists = arr.find((a) => a.id === item.id)
      const next = exists ? arr.filter((a) => a.id !== item.id) : [...arr, item]
      localStorage.setItem('tenant_saved_homes', JSON.stringify(next))
      setSavedIds(next.map((a) => a.id))
      // Do not redirect; just reflect Saved in UI
    } catch {
      setSavedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])
    }
  }

  const types = [
    { key: 'apartment', label: 'Apartment' },
    { key: 'house', label: 'House' },
    { key: 'villa', label: 'Villa' },
    { key: 'studio', label: 'Studio' },
    { key: 'land', label: 'Land' },
  ]

  const countsByType = React.useMemo(() => {
    const keys = ['apartment','house','villa','studio','land']
    const init = { sale: { available: 0, booked: 0 }, rental: { available: 0, booked: 0 } }
    const acc = Object.fromEntries(keys.map(k => [k, JSON.parse(JSON.stringify(init))]))
    for (const l of listings) {
      const type = (l.propertyType || '').toLowerCase()
      const tx = (l.transactionType || '').toLowerCase()
      const booked = !!l.booked
      if (acc[type] && (tx === 'sale' || tx === 'rental')) {
        acc[type][tx][booked ? 'booked' : 'available'] += 1
      }
    }
    return acc
  }, [listings])

  // Derived counts for current selection and filters
  const baseFiltered = selectedType ? listings
    .filter(l => (l.propertyType || '').toLowerCase() === selectedType)
    .filter(l => selectedType !== 'land' || landCatFilter === '' || (l.landCategory || '').toLowerCase() === landCatFilter)
    .filter(l => activeLocationFilter ? ((l.location || '').toLowerCase().includes(activeLocationFilter.toLowerCase())) : true)
    : []
  const rentAvailableCount = baseFiltered.filter(l => (l.transactionType || '') === 'rental' && !l.booked).length
  const rentBookedCount = baseFiltered.filter(l => (l.transactionType || '') === 'rental' && !!l.booked).length
  const saleAvailableCount = baseFiltered.filter(l => (l.transactionType || '') === 'sale' && !l.booked).length
  const saleBookedCount = baseFiltered.filter(l => (l.transactionType || '') === 'sale' && !!l.booked).length

  return (
    <div style={{ padding: 24 }}>
      <div className="hero">
        <span className="badge">Find your next home</span>
        <h1>Discover beautiful properties across the city</h1>
        <p>Browse curated rentals and homes for sale with rich photos, details, and neighborhood insights.</p>
        <div className="row">
          <input
            className="input"
            placeholder="Search location e.g. Mumbai, Koramangala"
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setMapQuery(mapSearch || 'Bengaluru, India'); setActiveLocationFilter((mapSearch||'').trim()); } }}
          />
          <select className="input" defaultValue="">
            <option value="" disabled>Type</option>
            <option>Apartment</option>
            <option>House</option>
            <option>Villa</option>
            <option>Studio</option>
            <option>Land</option>
          </select>
          <button className="btn btn-primary" onClick={() => { setMapQuery(mapSearch || 'Bengaluru, India'); setActiveLocationFilter((mapSearch||'').trim()); }}>Search</button>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginTop: 12, marginBottom: 8, flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {types.map(t => (
          <button
            key={t.key}
            className={`btn${selectedType===t.key ? ' btn-primary' : ''}`}
            onClick={() => { setSelectedType(t.key); setTxFilter(''); setLandCatFilter('') }}
          >{`${t.label} (Rent: ${countsByType[t.key]?.rental?.available || 0}/${countsByType[t.key]?.rental?.booked || 0} | Sale: ${countsByType[t.key]?.sale?.available || 0}/${countsByType[t.key]?.sale?.booked || 0})`}</button>
        ))}
      </div>

      {selectedType === 'land' && (
        <div className="row" style={{ gap: 8, marginTop: 4, marginBottom: 4 }}>
          <span className="muted">Land Type</span>
          <select className="input" value={landCatFilter} onChange={(e) => setLandCatFilter(e.target.value)}>
            <option value="">All</option>
            <option value="commercial">Commercial</option>
            <option value="farming">Farming</option>
          </select>
        </div>
      )}

      {selectedType ? (
        <>
          <div className="row" style={{ gap: 8, marginTop: 4, marginBottom: 4 }}>
            <span className="muted">Transaction</span>
            <select className="input" value={txFilter} onChange={(e) => setTxFilter(e.target.value)}>
              <option value="">All</option>
              <option value="rental">Rent</option>
              <option value="sale">Sale</option>
            </select>
          </div>

          {txFilter === '' ? (
            <>
              <section className="section">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h2>{types.find(t=>t.key===selectedType)?.label}: For Rent (available {rentAvailableCount} | booked {rentBookedCount})</h2>
                  <span className="muted">Top 10 results</span>
                </div>
                {loading && <div className="muted" style={{ marginTop: 12 }}>Loading listings...</div>}
                {error && !loading && <div className="muted" style={{ marginTop: 12 }}>{error}</div>}
                {!loading && !error && (
                  <div className="grid grid-3" style={{ marginTop: 12 }}>
                    {listings
                      .filter(l => (l.propertyType||'').toLowerCase()===selectedType && (l.transactionType||'')==='rental' && (selectedType!=='land' || landCatFilter==='' || (l.landCategory||'').toLowerCase()===landCatFilter))
                      .filter(l => activeLocationFilter ? ((l.location||'').toLowerCase().includes(activeLocationFilter.toLowerCase())) : true)
                      .slice(0,10)
                      .map((item) => (
                        <div key={item.id} className="card stack">
                          <ImageGrid columns={3} images={item.photos && item.photos.length ? item.photos.slice(0,3) : [
                            `https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop`,
                            `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
                            `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
                          ]} />
                          <div className="row" style={{ justifyContent: 'space-between' }}>
                            <strong>{item.title}</strong>
                            {item.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
                            <span className="badge">₹ {item.price} / mo</span>
                          </div>
                          <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                          <div className="row" style={{ gap: 8 }}>
                            <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                            <button className="btn" onClick={() => handleToggleSaved(item)}>{savedIds.includes(item.id) ? '♥' : '♡'}</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>

              <section className="section">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h2>{types.find(t=>t.key===selectedType)?.label}: For Sale (available {saleAvailableCount} | booked {saleBookedCount})</h2>
                  <span className="muted">Top 10 results</span>
                </div>
                {loading && <div className="muted" style={{ marginTop: 12 }}>Loading listings...</div>}
                {error && !loading && <div className="muted" style={{ marginTop: 12 }}>{error}</div>}
                {!loading && !error && (
                  <div className="grid grid-3" style={{ marginTop: 12 }}>
                    {listings
                      .filter(l => (l.propertyType||'').toLowerCase()===selectedType && (l.transactionType||'')==='sale' && (selectedType!=='land' || landCatFilter==='' || (l.landCategory||'').toLowerCase()===landCatFilter))
                      .filter(l => activeLocationFilter ? ((l.location||'').toLowerCase().includes(activeLocationFilter.toLowerCase())) : true)
                      .slice(0,10)
                      .map((item) => (
                        <div key={item.id} className="card stack">
                          <ImageGrid columns={3} images={item.photos && item.photos.length ? item.photos.slice(0,3) : [
                            `https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop`,
                            `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
                            `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
                          ]} />
                          <div className="row" style={{ justifyContent: 'space-between' }}>
                            <strong>{item.title}</strong>
                            {item.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
                            <span className="badge">₹ {item.price}</span>
                          </div>
                          <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                          <div className="row" style={{ gap: 8 }}>
                            <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                            <button className="btn" onClick={() => handleToggleSaved(item)}>{savedIds.includes(item.id) ? '♥' : '♡'}</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="section">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h2>{types.find(t=>t.key===selectedType)?.label}: {txFilter==='rental' ? `For Rent (available ${rentAvailableCount} | booked ${rentBookedCount})` : `For Sale (available ${saleAvailableCount} | booked ${saleBookedCount})`}</h2>
              </div>
              {loading && <div className="muted" style={{ marginTop: 12 }}>Loading listings...</div>}
              {error && !loading && <div className="muted" style={{ marginTop: 12 }}>{error}</div>}
              {!loading && !error && (
                <div className="grid grid-3" style={{ marginTop: 12 }}>
                  {listings
                    .filter(l => (l.propertyType||'').toLowerCase()===selectedType && (l.transactionType||'')===txFilter && (selectedType!=='land' || landCatFilter==='' || (l.landCategory||'').toLowerCase()===landCatFilter))
                    .filter(l => activeLocationFilter ? ((l.location||'').toLowerCase().includes(activeLocationFilter.toLowerCase())) : true)
                    .map((item) => (
                      <div key={item.id} className="card stack">
                        <ImageGrid columns={3} images={item.photos && item.photos.length ? item.photos.slice(0,3) : [
                          `https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop`,
                          `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
                          `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
                        ]} />
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <strong>{item.title}</strong>
                          {item.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
                          <span className="badge">{txFilter==='sale' ? `₹ ${item.price}` : `₹ ${item.price} / mo`}</span>
                        </div>
                        <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                        <div className="row" style={{ gap: 8 }}>
                          <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                          <button className="btn" onClick={() => handleToggleSaved(item)}>{savedIds.includes(item.id) ? '♥' : '♡'}</button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <section className="section">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>Featured Listings</h2>
            <span className="muted">Hand-picked homes with great amenities</span>
          </div>
          {loading && <div className="muted" style={{ marginTop: 12 }}>Loading listings...</div>}
          {error && !loading && <div className="muted" style={{ marginTop: 12 }}>{error}</div>}
          {!loading && !error && (
            <div className="grid grid-3" style={{ marginTop: 12 }}>
              {listings.slice(0, 6).map((item) => (
                <div key={item.id} className="card stack">
                  <ImageGrid
                    columns={3}
                    images={item.photos && item.photos.length ? item.photos.slice(0,3) : [
                      `https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop`,
                      `https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop`,
                      `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
                    ]}
                  />
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>{item.title}</strong>
                    {item.booked ? <span className="badge">Booked</span> : null}
                    <span className="badge">{item.transactionType === 'sale' ? `₹ ${item.price}` : `₹ ${item.price} / mo`}</span>
                  </div>
                  <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                  <div className="row" style={{ gap: 8 }}>
                    <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                    <button className="btn" onClick={() => handleToggleSaved(item)}>{savedIds.includes(item.id) ? '♥' : '♡'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="section">
        <h2>Explore on the Map</h2>
        <MapEmbed query={mapQuery} height={320} zoom={12} />
      </section>

      {false && selectedItem}
    </div>
  )
}

