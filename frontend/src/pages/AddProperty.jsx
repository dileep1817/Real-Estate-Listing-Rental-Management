import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

export default function AddProperty() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    transactionType: 'rental',
    propertyType: 'apartment',
    landCategory: '',
    photosText: '' // newline or comma separated URLs
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoFiles, setPhotoFiles] = useState([]) // File objects
  const [photoPreviews, setPhotoPreviews] = useState([]) // data URLs for preview & submit
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const parsePhotos = (text) => {
    if (!text) return []
    return text
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean)
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
    // reset the input so selecting the same file again works
    e.target.value = ''
  }

  const removePreview = (idx) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      setShowCamera(true)
    } catch (e) {
      setError('Unable to access camera. Please allow permissions or use device upload.')
    }
  }

  const closeCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setShowCamera(false)
  }

  const capturePhoto = () => {
    const video = document.getElementById('camera-video')
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPhotoPreviews(prev => [...prev, dataUrl])
    closeCamera()
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
        ownerName: user?.name || 'Owner',
        // Combine URL text + uploaded/captured data URLs
        photos: [...parsePhotos(form.photosText), ...photoPreviews],
        ...(form.propertyType === 'land' ? { landCategory: (form.landCategory || '').toLowerCase() } : {}),
      }
      await createListing(payload)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to add property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: '30px auto' }}>
      <h2>Add Property</h2>
      {error ? (<div className="error" style={{ marginBottom: 12 }}>{error}</div>) : null}
      <form onSubmit={onSubmit} className="form">
        <div className="form-group">
          <label>Title</label>
          <input className="input" name="title" value={form.title} onChange={onChange} placeholder="Beautiful 2BHK Apartment" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="input" name="description" value={form.description} onChange={onChange} placeholder="Describe the property..." />
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Price (per month)</label>
            <input className="input" name="price" type="number" min="0" value={form.price} onChange={onChange} placeholder="45000" />
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
          <input className="input" name="location" value={form.location} onChange={onChange} placeholder="Koramangala, Bengaluru" />
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
              <button type="button" className="btn" onClick={openCamera}>Capture from camera</button>
            </div>
            <div className="stack">
              <label>Or paste photo URLs (one per line or comma separated)</label>
              <textarea className="input" name="photosText" value={form.photosText} onChange={onChange} placeholder={`https://...\nhttps://...`} />
            </div>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
      </form>

      {showCamera && (
        <div className="modal" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="card stack" style={{ width: 480, maxWidth:'90vw' }}>
            <strong>Camera</strong>
            <video id="camera-video" autoPlay playsInline style={{ width: '100%', borderRadius: 6 }} ref={(el) => { if (el && stream) el.srcObject = stream }} />
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={closeCamera}>Cancel</button>
              <button className="btn btn-primary" onClick={capturePhoto}>Capture</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

