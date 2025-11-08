import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getListings } from '../api'
import ImageGrid from '../components/ImageGrid'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function Browse() {
  const navigate = useNavigate()
  const query = useQuery()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [propertyType, setPropertyType] = useState(query.get('propertyType') || '')
  const [transactionType, setTransactionType] = useState(query.get('transactionType') || '')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getListings()
        if (!active) return
        setListings(data)
      } catch (e) {
        if (active) setError('Failed to load properties')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (propertyType) params.set('propertyType', propertyType)
    if (transactionType) params.set('transactionType', transactionType)
    navigate({ search: params.toString() }, { replace: true })
  }, [propertyType, transactionType])

  const filtered = useMemo(() => {
    return listings.filter(l => (
      (!propertyType || (l.propertyType || '').toLowerCase() === propertyType.toLowerCase()) &&
      (!transactionType || (l.transactionType || '').toLowerCase() === transactionType.toLowerCase())
    ))
  }, [listings, propertyType, transactionType])

  // Derived counts for current property type (used in headings)
  const baseFiltered = useMemo(() => {
    return propertyType
      ? listings.filter(l => (l.propertyType || '').toLowerCase() === propertyType.toLowerCase())
      : []
  }, [listings, propertyType])
  const rentAvailableCount = useMemo(() => baseFiltered.filter(l => (l.transactionType || '').toLowerCase() === 'rental' && !l.booked).length, [baseFiltered])
  const rentBookedCount = useMemo(() => baseFiltered.filter(l => (l.transactionType || '').toLowerCase() === 'rental' && !!l.booked).length, [baseFiltered])
  const saleAvailableCount = useMemo(() => baseFiltered.filter(l => (l.transactionType || '').toLowerCase() === 'sale' && !l.booked).length, [baseFiltered])
  const saleBookedCount = useMemo(() => baseFiltered.filter(l => (l.transactionType || '').toLowerCase() === 'sale' && !!l.booked).length, [baseFiltered])

  // Per-type counts to show on buttons (availability breakdown)
  const countsByType = useMemo(() => {
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

  const typeOptions = [
    { key: '', label: 'All' },
    { key: 'apartment', label: 'Apartment' },
    { key: 'house', label: 'House' },
    { key: 'villa', label: 'Villa' },
    { key: 'studio', label: 'Studio' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div className="hero">
        <span className="badge">Browse Properties</span>
        <h1>Find the right {propertyType ? propertyType : 'home'}</h1>
        <p>Filter by type and choose Rental or Sale. Same clean layout as Home.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {typeOptions.map(t => (
            <button key={t.key} className={`btn${propertyType===t.key ? ' btn-primary' : ''}`} onClick={() => setPropertyType(t.key)}>
              {t.key
                ? `${t.label} (Rent: ${countsByType[t.key]?.rental?.available || 0}/${countsByType[t.key]?.rental?.booked || 0} | Sale: ${countsByType[t.key]?.sale?.available || 0}/${countsByType[t.key]?.sale?.booked || 0})`
                : t.label}
            </button>
          ))}
          <label className="row" style={{ gap: 8, marginLeft: 'auto' }}>
            <span className="muted">Transaction</span>
            <select className="input" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="">All</option>
              <option value="rental">Rental</option>
              <option value="sale">Sale</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <div className="muted" style={{ marginTop: 12 }}>Loading...</div>}
      {error && !loading && <div className="muted" style={{ marginTop: 12 }}>{error}</div>}

      {!loading && !error && (
        <>
          {propertyType && !transactionType ? (
            <>
              <section className="section" style={{ paddingTop: 0 }}>
                <div className="row" style={{ justifyContent:'space-between' }}>
                  <h2>{typeOptions.find(t=>t.key===propertyType)?.label || propertyType}: For Rent (available {rentAvailableCount} | booked {rentBookedCount})</h2>
                  <span className="muted">Top 10 results</span>
                </div>
                <div className="grid grid-3" style={{ marginTop: 12 }}>
                  {listings
                    .filter(l => (l.propertyType||'').toLowerCase()===propertyType.toLowerCase() && (l.transactionType||'')==='rental')
                    .slice(0,10)
                    .map(item => (
                      <div key={item.id} className="card stack">
                        <ImageGrid columns={3} images={item.photos && item.photos.length ? item.photos : [
                          'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop',
                        ]} />
                        <div className="row" style={{ justifyContent:'space-between' }}>
                          <strong>{item.title}</strong>
                          {item.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
                          <span className="badge">₹ {item.price} / mo</span>
                        </div>
                        <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                        <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                      </div>
                    ))}
                </div>
              </section>

              <section className="section">
                <div className="row" style={{ justifyContent:'space-between' }}>
                  <h2>{typeOptions.find(t=>t.key===propertyType)?.label || propertyType}: For Sale (available {saleAvailableCount} | booked {saleBookedCount})</h2>
                  <span className="muted">Top 10 results</span>
                </div>
                <div className="grid grid-3" style={{ marginTop: 12 }}>
                  {listings
                    .filter(l => (l.propertyType||'').toLowerCase()===propertyType.toLowerCase() && (l.transactionType||'')==='sale')
                    .slice(0,10)
                    .map(item => (
                      <div key={item.id} className="card stack">
                        <ImageGrid columns={3} images={item.photos && item.photos.length ? item.photos : [
                          'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop',
                        ]} />
                        <div className="row" style={{ justifyContent:'space-between' }}>
                          <strong>{item.title}</strong>
                          {item.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
                          <span className="badge">₹ {item.price}</span>
                        </div>
                        <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                        <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                      </div>
                    ))}
                </div>
              </section>
            </>
          ) : (
            <div className="grid grid-3" style={{ marginTop: 12 }}>
              {filtered.map(item => (
                <div key={item.id} className="card stack">
                  <ImageGrid columns={3} images={item.photos && item.photos.length ? item.photos : [
                    'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop',
                  ]} />
                  <div className="row" style={{ justifyContent:'space-between' }}>
                    <strong>{item.title}</strong>
                    {item.booked ? <span className="badge">Booked</span> : <span className="badge">Available</span>}
                    <span className="badge">{item.transactionType === 'sale' ? `₹ ${item.price}` : `₹ ${item.price} / mo`}</span>
                  </div>
                  <div className="muted">{(item.propertyType || '').toUpperCase()} • {item.location}</div>
                  <Link to={`/property/${item.id}`} className="btn btn-primary">View Details</Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
