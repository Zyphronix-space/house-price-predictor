import { useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import FieldInput from './FieldInput'
import { api, ApiError } from '../../lib/api'
import './WhatIfSimulator.css'

const EDITABLE = ['AveRooms', 'HouseAge', 'MedInc', 'AveOccup']

export default function WhatIfSimulator({ baseFeatures, baseValue, onClose }) {
  const [values, setValues] = useState(() => ({ ...baseFeatures }))
  const [scenario, setScenario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (name, raw) => {
    setValues((prev) => ({ ...prev, [name]: raw }))
  }

  const runScenario = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
      const res = await api.predict(payload)
      setScenario(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not run the scenario.')
    } finally {
      setLoading(false)
    }
  }

  const change = scenario ? scenario.predicted_price_usd - baseValue : 0

  return (
    <section className="hv-card what-if">
      <div className="what-if__header">
        <p className="hv-label">What if?</p>
        <button type="button" className="hv-btn hv-btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="what-if__note">
        Model simulation — edit a few inputs and see what the same model predicts. This
        doesn't mean changing the real property would produce this market value.
      </p>

      <div className="what-if__fields">
        {EDITABLE.map((name) => (
          <FieldInput key={name} name={name} value={values[name]} onChange={handleChange} />
        ))}
      </div>

      <button type="button" className="hv-btn hv-btn-primary" onClick={runScenario} disabled={loading}>
        {loading ? 'Running…' : 'Run Scenario'}
      </button>

      {error && <p className="what-if__error">{error}</p>}

      {scenario && (
        <div className="what-if__result">
          <div>
            <p className="hv-label">Current</p>
            <AnimatedNumber value={baseValue} className="what-if__figure" />
          </div>
          <div>
            <p className="hv-label">Scenario</p>
            <AnimatedNumber value={scenario.predicted_price_usd} className="what-if__figure" />
          </div>
          <div>
            <p className="hv-label">Change</p>
            <span className={`what-if__figure ${change >= 0 ? 'is-positive' : 'is-negative'}`}>
              {change >= 0 ? '+' : '-'}${Math.abs(Math.round(change)).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
