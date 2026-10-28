import { formatUsd } from './format'

// Everyday wording for the model's eight inputs. Each one describes a whole
// census block group (a neighbourhood of roughly 600 to 3,000 people) in
// 1990, so the labels say "in the area" / "on average", never "your home".
export const AREA_FACTS = [
  { name: 'MedInc', label: 'Typical household income', format: (v) => `${formatUsd(Math.round(v * 100) * 100)} a year` },
  { name: 'HouseAge', label: 'Typical age of homes', format: (v) => `${Math.round(v)} years` },
  { name: 'AveRooms', label: 'Rooms per home, on average', format: (v) => Number(v).toFixed(1) },
  { name: 'AveBedrms', label: 'Bedrooms per home, on average', format: (v) => Number(v).toFixed(1) },
  { name: 'Population', label: 'People living in the area', format: (v) => Math.round(v).toLocaleString() },
  { name: 'AveOccup', label: 'People per household, on average', format: (v) => Number(v).toFixed(1) },
]

/** Plain-language notes for inputs outside the range the model mostly
 *  saw (1st to 99th percentile) -- the same test the API's warnings use. */
export function unusualFigures(inputs, ranges) {
  const notes = []
  for (const f of AREA_FACTS) {
    const v = Number(inputs[f.name])
    const r = ranges[f.name]
    if (v < r.p1) notes.push(`${f.label} (${f.format(v)}) is lower than in almost every area the model learned from.`)
    else if (v > r.p99) notes.push(`${f.label} (${f.format(v)}) is higher than in almost every area the model learned from.`)
  }
  const outside = ['Latitude', 'Longitude'].some((n) => inputs[n] < ranges[n].p1 || inputs[n] > ranges[n].p99)
  if (outside) notes.push('The location is near the edge of the area the model covers.')
  return notes
}

const FACTOR_NAMES = {
  MedInc: 'Household incomes in the area',
  HouseAge: 'The age of homes in the area',
  AveRooms: 'The size of homes (rooms per home)',
  AveBedrms: 'Bedrooms per home',
  Population: 'How many people live in the area',
  AveOccup: 'Household size',
  location: 'Where the area is in California',
}

/** The few inputs that moved this estimate most, from the model's own
 *  per-input contributions. Latitude and longitude are summed into one
 *  "location" factor: contributions are additive, so the sum is exact. */
export function topFactors(explanation, count = 3) {
  if (!explanation) return []
  const merged = new Map()
  for (const c of explanation.contributions) {
    const key = c.feature === 'Latitude' || c.feature === 'Longitude' ? 'location' : c.feature
    merged.set(key, (merged.get(key) ?? 0) + c.shap_usd)
  }
  return [...merged.entries()]
    .map(([key, usd]) => ({ key, usd, label: FACTOR_NAMES[key] }))
    .sort((a, b) => Math.abs(b.usd) - Math.abs(a.usd))
    .slice(0, count)
}

export function describeFactor({ label, usd }) {
  return `${label} ${usd >= 0 ? 'raised' : 'lowered'} the estimate by about ${formatUsd(Math.abs(Math.round(usd / 100) * 100))}.`
}
