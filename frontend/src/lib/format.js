// Shared display formatting. Prices are the dataset's own unit (US
// dollars from the 1990 California census), never converted.

// The backend stores UTC timestamps and serializes them without a zone
// suffix ("2026-10-25T15:11:15"). new Date() reads a suffix-less string as
// *local* time, which shifted every timestamp by the viewer's UTC offset.
export function parseApiDate(iso) {
  if (!iso) return null
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(hasZone || iso.length <= 10 ? iso : `${iso}Z`)
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const formatUsd = (v) => (v == null || Number.isNaN(v) ? '-' : usd.format(Math.round(v)))

export function formatUsdCompact(v) {
  if (v == null) return '-'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}k`
  return `$${Math.round(v)}`
}

export const formatSignedUsd = (v) => `${v >= 0 ? '+' : '−'}${usd.format(Math.abs(Math.round(v)))}`

export function formatDateTime(iso) {
  const d = parseApiDate(iso)
  return d ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'
}

export function formatDate(iso) {
  const d = parseApiDate(iso)
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
}

export function timeAgo(iso) {
  const d = parseApiDate(iso)
  if (!d) return '-'
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
