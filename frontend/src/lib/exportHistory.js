import { FEATURE_ORDER } from './fields'

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportHistoryAsJson(entries) {
  download('valuation-history.json', JSON.stringify(entries, null, 2), 'application/json')
}

export function exportHistoryAsCsv(entries) {
  const header = ['created_at', 'predicted_price_usd', ...FEATURE_ORDER]
  const rows = entries.map((e) => [
    e.created_at,
    e.predicted_price_usd,
    ...FEATURE_ORDER.map((f) => e.features[f]),
  ])
  const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
  download('valuation-history.csv', csv, 'text/csv')
}
