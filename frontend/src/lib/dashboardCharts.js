// Pure client-side aggregation over the user's real prediction rows
// (api.predictions.list()) -- no fabricated data, just bucketing what
// already exists so the dashboard can show activity/distribution charts.

export function bucketByDay(predictions, days = 14) {
  const now = new Date()
  const dayKeys = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dayKeys.push(d.toISOString().slice(0, 10))
  }
  const counts = Object.fromEntries(dayKeys.map((k) => [k, 0]))
  for (const p of predictions) {
    const key = p.created_at.slice(0, 10)
    if (key in counts) counts[key] += 1
  }
  return dayKeys.map((key) => ({ key, count: counts[key] }))
}

export function histogram(values, binCount = 6) {
  if (values.length === 0) return { edges: [], counts: [] }
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    return { edges: [min, max], counts: [values.length] }
  }
  const width = (max - min) / binCount
  const counts = new Array(binCount).fill(0)
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / width))
    counts[idx] += 1
  }
  const edges = Array.from({ length: binCount + 1 }, (_, i) => min + i * width)
  return { edges, counts }
}
