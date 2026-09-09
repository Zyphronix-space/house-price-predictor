import { FIELD_META } from '../../lib/fields'
import './SliderField.css'

// Bounded range input for scenario exploration (What-If Simulator). Bounds
// come from the real dataset's p1-p99 range, not arbitrary numbers.
export default function SliderField({ name, value, onChange, bounds }) {
  const meta = FIELD_META[name]
  const min = bounds?.p1 ?? 0
  const max = bounds?.p99 ?? 100
  const step = (max - min) / 200 || 1
  const num = Number(value)

  return (
    <div className="slider-field">
      <div className="slider-field__head">
        <span className="slider-field__label">{meta.label}</span>
        <span className="slider-field__value">
          {Number.isFinite(num) ? num.toFixed(2) : '-'} <span className="slider-field__unit">{meta.unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="slider-field__range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(num) ? num : min}
        onChange={(e) => onChange(name, e.target.value)}
        aria-label={meta.label}
      />
      <div className="slider-field__bounds">
        <span>{min.toFixed(2)}</span>
        <span>{max.toFixed(2)}</span>
      </div>
    </div>
  )
}
