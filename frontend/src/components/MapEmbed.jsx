import React from 'react'

export default function MapEmbed({ query = 'New York, USA', height = 300, zoom = 12 }) {
  const key = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&zoom=${encodeURIComponent(zoom)}`
    : `https://www.google.com/maps?q=${encodeURIComponent(query)}&t=&z=${encodeURIComponent(zoom)}&ie=UTF8&iwloc=&output=embed`
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <iframe
        title={`Map of ${query}`}
        width="100%"
        height={height}
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups"
        src={src}
      />
    </div>
  )
}
