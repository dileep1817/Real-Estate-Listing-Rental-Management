import React from 'react'

export default function ImageGrid({ images = [], columns = 3 }) {
  const col = Math.max(2, Math.min(4, columns))
  return (
    <div className={`grid grid-${col}`}>
      {images.map((src, i) => (
        <img key={i} src={src} alt={`photo-${i}`} className="img-tile" loading="lazy" />
      ))}
    </div>
  )
}
