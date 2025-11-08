import React from 'react'
import ImageGrid from '../components/ImageGrid'
import MapEmbed from '../components/MapEmbed'

export default function AdminDashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>

      <div className="grid grid-3 section">
        <div className="card stack">
          <strong>Users Pending Verification</strong>
          <div className="row">
            <span className="badge">14</span>
            <span className="muted">profiles</span>
          </div>
        </div>
        <div className="card stack">
          <strong>Listings Awaiting Approval</strong>
          <div className="row">
            <span className="badge">7</span>
            <span className="muted">submissions</span>
          </div>
        </div>
        <div className="card stack">
          <strong>Reports</strong>
          <div className="row">
            <span className="badge">3</span>
            <span className="muted">open cases</span>
          </div>
        </div>
      </div>

      <section className="section">
        <h2>Moderation Queue</h2>
        <div className="grid grid-3" style={{ marginTop: 12 }}>
          {[1,2,3].map((i) => (
            <div key={i} className="card stack">
              <ImageGrid
                columns={3}
                images={[
                  `https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop`,
                  `https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop`,
                  `https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop`,
                ]}
              />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>Listing #{100 + i}</strong>
                <span className="badge">Review</span>
              </div>
              <div className="row">
                <button className="btn">Reject</button>
                <button className="btn btn-primary">Approve</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Global Activity Map</h2>
        <MapEmbed query="India" height={300} zoom={5} />
      </section>
    </div>
  )
}
