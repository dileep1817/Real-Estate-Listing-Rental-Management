import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TenantDashboard() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/tenant/applications', { replace: true })
  }, [navigate])
  return (
    <div style={{ padding: 24 }}>
      <h1>Tenant Dashboard</h1>
      <div className="muted">Redirecting to Applications… Use the top navigation to access Applications, Messages, or Saved.</div>
    </div>
  )
}

