import { FEATURE_ORDER } from './fields'

// The model's own reference data: all 20,640 California census block
// groups (1990) it was trained on, exported by ml/export_neighbourhoods.py.
// Fetched once, only when someone picks a location.
let loading = null

function loadRows() {
  if (!loading) {
    loading = fetch('/data/neighbourhoods.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data.fields.join() !== FEATURE_ORDER.join()) throw new Error('Unexpected data layout')
        return data.rows
      })
      .catch((err) => {
        loading = null // allow a retry
        throw err
      })
  }
  return loading
}

const LAT = FEATURE_ORDER.indexOf('Latitude')
const LON = FEATURE_ORDER.indexOf('Longitude')

// Distance on a small patch of the Earth's surface; plenty accurate for
// picking the closest block group within California.
function distanceKm(lat1, lon1, lat2, lon2) {
  const kx = 111.32 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180))
  const dx = (lon2 - lon1) * kx
  const dy = (lat2 - lat1) * 110.57
  return Math.hypot(dx, dy)
}

// City centres often land on unusual block groups (a downtown core with
// very few homes), where the model is least reliable. Within this radius,
// prefer the nearest block group whose figures all sit inside the range
// the model mostly saw (1st to 99th percentile); otherwise use the nearest.
const TYPICAL_RADIUS_KM = 5

const isTypical = (row, ranges) =>
  FEATURE_ORDER.every((name, i) => row[i] >= ranges[name].p1 && row[i] <= ranges[name].p99)

/** A real census block group near a point, with its eight model inputs
 *  exactly as recorded, and how far away it is. */
export async function nearestNeighbourhood(lat, lon, ranges) {
  const rows = await loadRows()
  let nearest = null
  let nearestKm = Infinity
  let typical = null
  let typicalKm = Infinity
  for (const row of rows) {
    const km = distanceKm(lat, lon, row[LAT], row[LON])
    if (km < nearestKm) {
      nearestKm = km
      nearest = row
    }
    if (km < typicalKm && km <= TYPICAL_RADIUS_KM && isTypical(row, ranges)) {
      typicalKm = km
      typical = row
    }
  }
  const [row, km] = typical ? [typical, typicalKm] : [nearest, nearestKm]
  return {
    features: Object.fromEntries(FEATURE_ORDER.map((name, i) => [name, row[i]])),
    distanceKm: km,
  }
}
