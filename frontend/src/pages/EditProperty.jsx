import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getListing, updateListing } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

export default function EditProperty() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [item, setItem] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    transactionType: 'rental',
    propertyType: 'apartment',
    landCategory: '',
    photosText: ''
  })
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [photoFiles, setPhotoFiles] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getListing(id)
        if (!active) return
        setItem(data)
        setForm({
          title: data?.title || '',
          description: data?.description || '',
          price: String(data?.price ?? ''),
          location: data?.location || '',
          transactionType: data?.transactionType || 'rental',
          propertyType: (data?.propertyType || 'apartment').toLowerCase(),
          landCategory: (data?.landCategory || ''),
          photosText: ''
        })
        setPhotoPreviews(Array.isArray(data?.photos) ? data.photos : [])
      } catch (e) {
        setError('Failed to load property')
      } finally {
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const parsePhotos = (text) => {
    if (!text) return []
    return text.split(/\n|,/).map(s => s.trim()).filter(Boolean)
  }

  const readFilesAsDataUrls = (files) => {
    const readers = []
    for (const file of files) {
      readers.push(new Promise((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result)
        fr.onerror = reject
        fr.readAsDataURL(file)
      }))
    }
    return Promise.all(readers)
  }

  const onSelectPhotos = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setPhotoFiles(prev => [...prev, ...files])
    const urls = await readFilesAsDataUrls(files)
    setPhotoPreviews(prev => [...prev, ...urls])
    e.target.value = ''
  }

  const removePreview = (idx) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.price) {
      setError('Title and Price are required')
      return
    }
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        location: form.location.trim(),
        transactionType: form.transactionType,
        propertyType: form.propertyType,
        ownerName: user?.name || item?.ownerName || 'Owner',
        photos: [...parsePhotos(form.photosText), ...photoPreviews],
        ...(form.propertyType === 'land' ? { landCategory: (form.landCategory || '').toLowerCase() } : {}),
      }
      await updateListing(Number(id), payload)
      navigate('/owner/properties', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: '30px auto' }}>
      <h2>Edit Property</h2>
      {error ? (<div className="error" style={{ marginBottom: 12 }}>{error}</div>) : null}
      {loading ? (
        <div className="muted">Loading...</div>
      ) : (
        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label>Title</label>
            <input className="input" name="title" value={form.title} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="input" name="description" value={form.description} onChange={onChange} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Price {form.transactionType === 'sale' ? '' : '(per month)'}</label>
              <input className="input" name="price" type="number" min="0" value={form.price} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Transaction</label>
              <select className="input" name="transactionType" value={form.transactionType} onChange={onChange}>
                <option value="rental">Rental</option>
                <option value="sale">Sale</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Property Type</label>
            <select className="input" name="propertyType" value={form.propertyType} onChange={onChange}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
              <option value="land">Land</option>
            </select>
          </div>
          {form.propertyType === 'land' && (
            <div className="form-group">
              <label>Land Type</label>
              <select className="input" name="landCategory" value={form.landCategory} onChange={onChange}>
                <option value="">Select type</option>
                <option value="commercial">Commercial</option>
                <option value="farming">Farming</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Location</label>
            <input className="input" name="location" value={form.location} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Photos</label>
            <div className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="card stack" style={{ padding: 6 }}>
                    <img src={src} alt={`photo-${idx}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                    <button type="button" className="btn" onClick={() => removePreview(idx)}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <label className="btn">
                  Select from device
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onSelectPhotos} />
                </label>
              </div>
              <div className="stack">
                <label>Add photo URLs (one per line or comma separated)</label>
                <textarea className="input" name="photosText" value={form.photosText} onChange={onChange} placeholder={`https://...\nhttps://...`} />
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" className="btn" onClick={() => navigate('/owner/properties')}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
