import { useRef } from 'react'
import { FALLBACK_RANGES } from '../../lib/fields'
import './CaliforniaMap.css'

// Original, simplified illustration of California's outline -- hand-drawn
// as a rough polygon for this app, not traced from any third-party map
// asset. It's a UI affordance for picking an approximate lat/lon, not a
// precise or navigable map.
const W = 320
const H = 420
const OUTLINE = [
  [45, 8], [320, 0], [288, 63], [310, 118], [282, 168], [301, 218], [275, 252],
  [291, 286], [266, 328], [250, 378], [186, 420], [90, 420], [58, 386],
  [32, 349], [10, 307], [29, 265], [3, 223], [22, 193], [6, 168], [26, 126],
  [10, 80], [32, 29],
].map((p) => p.join(',')).join(' ')

const { min: lonMin, max: lonMax } = FALLBACK_RANGES.Longitude
const { min: latMin, max: latMax } = FALLBACK_RANGES.Latitude

function toXY(lat, lon) {
  const x = ((lon - lonMin) / (lonMax - lonMin)) * W
  const y = ((latMax - lat) / (latMax - latMin)) * H
  return [x, y]
}

function toLatLon(x, y) {
  const lon = lonMin + (x / W) * (lonMax - lonMin)
  const lat = latMax - (y / H) * (latMax - latMin)
  return {
    lat: Math.min(latMax, Math.max(latMin, lat)),
    lon: Math.min(lonMax, Math.max(lonMin, lon)),
  }
}

export default function CaliforniaMap({ latitude, longitude, onPick }) {
  const svgRef = useRef(null)

  const handlePick = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * W
    const y = ((clientY - rect.top) / rect.height) * H
    onPick(toLatLon(x, y))
  }

  const lat = Number(latitude)
  const lon = Number(longitude)
  const hasMarker = Number.isFinite(lat) && Number.isFinite(lon)
  const [markerX, markerY] = hasMarker ? toXY(lat, lon) : [0, 0]

  return (
    <div className="ca-map">
      <svg
        ref={svgRef}
        className="ca-map__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Tap or click to set an approximate location within California"
        onClick={(e) => handlePick(e.clientX, e.clientY)}
      >
        <polygon points={OUTLINE} className="ca-map__outline" />
        {hasMarker && (
          <g className="ca-map__marker" transform={`translate(${markerX} ${markerY})`}>
            <circle r="10" className="ca-map__marker-halo" />
            <circle r="4" className="ca-map__marker-dot" />
          </g>
        )}
      </svg>
      <p className="ca-map__caption">
        Tap the map for an approximate location, or enter coordinates directly. The
        dataset describes block groups, not exact addresses, so treat this as a
        neighborhood-level pick.
      </p>
    </div>
  )
}
