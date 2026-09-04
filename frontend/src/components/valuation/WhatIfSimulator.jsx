import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import SliderField from './SliderField'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { FEATURE_ORDER, FALLBACK_RANGES } from '../../lib/fields'
import './WhatIfSimulator.css'

function toBoundsMap(datasetStats) {
  if (!datasetStats) return FALLBACK_RANGES
  return Object.fromEntries(
    Object.entries(datasetStats.features).map(([name, s]) => [name, { p1: s.p1, p99: s.p99 }])
  )
}

export default function WhatIfSimulator({ baseFeatures, baseValue, onClose }) {
  const [values, setValues] = useState(() => ({ ...baseFeatures }))
  const [scenario, setScenario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const bounds = toBoundsMap(datasetStats)

  const handleChange = (name, raw) => {
    setValues((prev) => ({ ...prev, [name]: raw }))
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
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
    }, 400)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)])

  const reset = () => setValues({ ...baseFeatures })

  const change = scenario ? scenario.predicted_price_usd - baseValue : 0

  return (
    <section className="hv-card what-if">
      <div className="what-if__header">
        <p className="hv-label">Scenario Simulator</p>
        <div className="what-if__header-actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={reset}>
            Reset
          </button>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <p className="what-if__note">
        Move a slider to change one input and see what the same model predicts for that
        scenario. This is a model simulation, not a claim that changing the real property
        would move its market value this way.
      </p>

      <div className="what-if__fields">
        {FEATURE_ORDER.map((name) => (
          <SliderField key={name} name={name} value={values[name]} onChange={handleChange} bounds={bounds[name]} />
        ))}
      </div>

      {error && <p className="what-if__error">{error}</p>}

      <div className="what-if__result" aria-busy={loading}>
        <div>
          <p className="hv-label">Original</p>
          <AnimatedNumber value={baseValue} className="what-if__figure" />
        </div>
        <div>
          <p className="hv-label">Scenario{loading ? ' (updating…)' : ''}</p>
          <AnimatedNumber value={scenario ? scenario.predicted_price_usd : baseValue} className="what-if__figure" />
        </div>
        <div>
          <p className="hv-label">Difference</p>
          <span className={`what-if__figure ${change >= 0 ? 'is-positive' : 'is-negative'}`}>
            {scenario ? `${change >= 0 ? '+' : '-'}$${Math.abs(Math.round(change)).toLocaleString()}` : '—'}
          </span>
        </div>
      </div>
    </section>
  )
}
