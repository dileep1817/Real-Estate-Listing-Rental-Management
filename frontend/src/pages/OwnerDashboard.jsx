import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OwnerDashboard() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/owner/listings', { replace: true })
  }, [navigate])
  return (
    <div style={{ padding: 24 }}>
      <h1>Owner Dashboard</h1>
      <div className="muted">Redirecting to Listings… Use the top navigation to access Listings, Requests, Messages, or Portfolio.</div>
    </div>
  )
}

