import { FIELD_META } from './fields'

// Empty / NaN / Infinity / not-a-number checks. Returns an error string,
// or null when the raw input is a usable number.
export function validateRequired(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return 'This field is required.'
  }
  const num = Number(rawValue)
  if (Number.isNaN(num)) return 'Enter a valid number.'
  if (!Number.isFinite(num)) return 'Enter a finite number.'
  return null
}

// Client-side "outside the training range" warning, mirroring the same
// check the backend runs against dataset_stats.json. Non-blocking.
export function rangeWarning(name, value, ranges) {
  const bounds = ranges?.[name]
  if (!bounds) return null
  const num = Number(value)
  if (Number.isNaN(num)) return null
  if (num < bounds.p1 || num > bounds.p99) {
    const meta = FIELD_META[name]
    return `This value is outside the range seen in the training dataset (${bounds.p1}–${bounds.p99} ${meta.unit}).`
  }
  return null
}

// Validates a whole feature set (values keyed by feature name).
// Returns { errors: {field: msg}, warnings: {field: msg}, isValid }.
export function validateFeatures(values, ranges) {
  const errors = {}
  const warnings = {}
  for (const name of Object.keys(FIELD_META)) {
    const err = validateRequired(values[name])
    if (err) {
      errors[name] = err
      continue
    }
    const warn = rangeWarning(name, values[name], ranges)
    if (warn) warnings[name] = warn
  }
  return { errors, warnings, isValid: Object.keys(errors).length === 0 }
}
