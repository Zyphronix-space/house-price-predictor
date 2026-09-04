import { useState } from 'react'
import { FIELD_META, FEATURE_ORDER } from '../../lib/fields'
import { api, ApiError } from '../../lib/api'
import './DescribePropertyInput.css'

const PLACEHOLDER =
  'e.g. "A mid-income neighborhood near Sacramento, houses about 20 years old, roughly 3,000 people nearby."'

// Gemini only extracts candidate field values -- it never computes a
// price. Extracted fields are merged into the caller's form state so the
// same guided-form validation and review step apply before submit().
export default function DescribePropertyInput({ onExtracted }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState(null)
  const [filledFields, setFilledFields] = useState([])

  const handleExtract = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setNotes(null)
    setFilledFields([])
    try {
      const extracted = await api.parseDescription(text)
      const { unrecognized_notes, ...fields } = extracted
      const present = FEATURE_ORDER.filter((name) => fields[name] !== null && fields[name] !== undefined)
      if (present.length === 0) {
        setError("Couldn't confidently extract any fields from that description. Try being more specific, or use the guided form.")
        return
      }
      onExtracted(Object.fromEntries(present.map((name) => [name, fields[name]])))
      setFilledFields(present)
      if (unrecognized_notes) setNotes(unrecognized_notes)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not parse that description. Try the guided form instead.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="describe-input">
      <p className="describe-input__note">
        Describe the neighborhood in plain language. An AI model extracts candidate values for
        this model's real inputs — it never sets the price. You'll review and can edit every
        value before estimating.
      </p>
      <textarea
        className="hv-input describe-input__textarea"
        rows={4}
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
      />
      <button
        type="button"
        className="hv-btn hv-btn-primary"
        onClick={handleExtract}
        disabled={loading || !text.trim()}
      >
        {loading ? 'Extracting…' : 'Extract Fields'}
      </button>

      {error && <p className="describe-input__error">{error}</p>}

      {filledFields.length > 0 && (
        <p className="describe-input__success">
          Filled in: {filledFields.map((name) => FIELD_META[name].label).join(', ')}. Continue to
          the guided form to review, edit, and fill in anything left blank.
        </p>
      )}
      {notes && <p className="describe-input__notes">Not usable by this model: {notes}</p>}
    </div>
  )
}
