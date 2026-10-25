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
    const fmt = (v) => Number(v.toPrecision(4)).toLocaleString()
    return `Unusual for the training data (most block groups fall between ${fmt(bounds.p1)} and ${fmt(bounds.p99)}). The estimate may be less reliable.`
  }
  return null
}

// Values no real block group can have. These block submission; merely
// unusual values only warn (see rangeWarning).
const MUST_BE_POSITIVE = ['MedInc', 'AveRooms', 'AveBedrms', 'Population', 'AveOccup']

export function impossibleValue(name, value, values) {
  const num = Number(value)
  if (MUST_BE_POSITIVE.includes(name) && num <= 0) return 'Must be greater than 0.'
  if (name === 'HouseAge' && num < 0) return 'Cannot be negative.'
  if (name === 'Latitude' && (num < -90 || num > 90)) return 'Latitude must be between -90 and 90.'
  if (name === 'Longitude' && (num < -180 || num > 180)) return 'Longitude must be between -180 and 180.'
  if (name === 'AveBedrms' && Number(values?.AveRooms) > 0 && num > Number(values.AveRooms)) {
    return 'Cannot exceed rooms per household (bedrooms are counted as rooms).'
  }
  return null
}

// Validates a whole feature set (values keyed by feature name).
// Returns { errors: {field: msg}, warnings: {field: msg}, isValid }.
export function validateFeatures(values, ranges) {
  const errors = {}
  const warnings = {}
  for (const name of Object.keys(FIELD_META)) {
    const err = validateRequired(values[name]) ?? impossibleValue(name, values[name], values)
    if (err) {
      errors[name] = err
      continue
    }
    const warn = rangeWarning(name, values[name], ranges)
    if (warn) warnings[name] = warn
  }
  return { errors, warnings, isValid: Object.keys(errors).length === 0 }
}
