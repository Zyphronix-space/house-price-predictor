import { useState } from 'react'
import { HOUSE_FEATURE_FIELDS } from '../../lib/houseFields'
import './HouseForm.css'

const emptyValues = () =>
  Object.fromEntries(HOUSE_FEATURE_FIELDS.map(({ key }) => [key, '']))

export default function HouseForm({ initial, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [values, setValues] = useState(() => {
    if (!initial) return emptyValues()
    return Object.fromEntries(HOUSE_FEATURE_FIELDS.map(({ key }) => [key, String(initial[key] ?? '')]))
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleChange = (key, value) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const numeric = {}
    for (const { key, label: fieldLabel } of HOUSE_FEATURE_FIELDS) {
      const raw = values[key]
      const num = Number(raw)
      if (raw === '' || Number.isNaN(num)) {
        setError(`${fieldLabel} must be a number`)
        return
      }
      numeric[key] = num
    }

    setSaving(true)
    try {
      await onSubmit({ label: label.trim(), notes: notes.trim() || null, ...numeric })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="house-form" onSubmit={handleSubmit}>
      <label className="house-form__field house-form__field--wide">
        <span className="hv-label">Property name</span>
        <input
          className="hv-input"
          required
          maxLength={120}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Downtown condo, Grandma's house"
        />
      </label>

      <div className="house-form__grid">
        {HOUSE_FEATURE_FIELDS.map(({ key, label: fieldLabel, unit, placeholder }) => (
          <label key={key} className="house-form__field">
            <span className="hv-label">
              {fieldLabel} <span className="house-form__unit">({unit})</span>
            </span>
            <input
              className="hv-input"
              type="number"
              step="any"
              required
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
            />
          </label>
        ))}
      </div>

      <label className="house-form__field house-form__field--wide">
        <span className="hv-label">Notes (optional)</span>
        <textarea
          className="hv-input house-form__notes"
          maxLength={1000}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering about this property"
        />
      </label>

      {error && <p className="house-form__error">{error}</p>}

      <div className="house-form__actions">
        <button type="button" className="hv-btn hv-btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="hv-btn hv-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
