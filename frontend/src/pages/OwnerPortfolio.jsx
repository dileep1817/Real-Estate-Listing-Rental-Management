import React from 'react'
import MapEmbed from '../components/MapEmbed'

export default function OwnerPortfolio() {
  return (
    <div className="container page" style={{ padding: 24 }}>
      <h1>Portfolio Map</h1>
      <div className="card" style={{ padding: 0 }}>
        <MapEmbed query="Bengaluru, India" height={420} zoom={11} />
      </div>
    </div>
  )
}
