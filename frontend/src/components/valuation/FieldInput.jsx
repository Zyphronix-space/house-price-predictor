import { FIELD_META } from '../../lib/fields'
import './FieldInput.css'

export default function FieldInput({ name, value, onChange, error, warning, disabled }) {
  const meta = FIELD_META[name]
  const inputId = `field-${name}`
  const hintId = `${inputId}-hint`
  const describedBy = [hintId, error && `${inputId}-error`, warning && `${inputId}-warning`].filter(Boolean).join(' ')

  return (
    <div className={`field-input${error ? ' has-error' : ''}`}>
      <label className="field-input__label" htmlFor={inputId}>
        {meta.label}
      </label>
      <div className="field-input__control">
        <input
          id={inputId}
          className="hv-input"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder={meta.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(name, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
        />
        <span className="field-input__unit" aria-hidden="true">{meta.unit}</span>
      </div>
      <span id={hintId} className="field-input__explanation">{meta.explanation}</span>
      {error && <span id={`${inputId}-error`} className="field-input__error">{error}</span>}
      {!error && warning && (
        <span id={`${inputId}-warning`} className="field-input__warning">{warning}</span>
      )}
    </div>
  )
}
