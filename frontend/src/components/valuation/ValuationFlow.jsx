import { useState } from 'react'
import FieldInput from './FieldInput'
import CaliforniaMap from './CaliforniaMap'
import PredictionResult from './PredictionResult'
import LoadingStages from './LoadingStages'
import WhyThisPrice from './WhyThisPrice'
import WhatIfSimulator from './WhatIfSimulator'
import ValuationReport from './ValuationReport'
import DescribePropertyInput from './DescribePropertyInput'
import { Link } from 'react-router-dom'
import Limitations from '../Limitations'
import ErrorState from '../ErrorState'
import { SECTIONS, FIELD_META, EXAMPLE_PROPERTY, FALLBACK_RANGES } from '../../lib/fields'
import { validateFeatures } from '../../lib/validation'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/authContext'
import { addToComparison } from '../../lib/storage'
import { showToast } from '../../lib/toast'
import './ValuationFlow.css'

function toRangeMap(datasetStats) {
  if (!datasetStats) return FALLBACK_RANGES
  return Object.fromEntries(
    Object.entries(datasetStats.features).map(([name, s]) => [name, { p1: s.p1, p99: s.p99 }])
  )
}

export default function ValuationFlow({ setView }) {
  const { user } = useAuth()
  const [values, setValues] = useState(EXAMPLE_PROPERTY)
  const [showErrors, setShowErrors] = useState(false)
  const [phase, setPhase] = useState('form') // form | loading | result | error
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [savedNotice, setSavedNotice] = useState(null)
  const [entryMode, setEntryMode] = useState('guided') // 'guided' | 'describe'

  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const ranges = toRangeMap(datasetStats)
  const { errors, warnings, isValid } = validateFeatures(values, ranges)
  const errorFields = Object.keys(errors)

  const handleChange = (name, raw) => setValues((prev) => ({ ...prev, [name]: raw }))

  const handleEstimateClick = () => {
    if (!isValid) {
      setShowErrors(true)
      document.getElementById('valuation-flow-error-summary')?.focus()
      return
    }
    submit()
  }

  const submit = async () => {
    setPhase('loading')
    setSubmitError(null)
    try {
      const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
      const res = await api.predict(payload)
      setResult(res)
      setPhase('result')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong while valuing this property.')
      setPhase('error')
    }
  }

  const restart = () => {
    setPhase('form')
    setShowErrors(false)
    setResult(null)
    setShowWhatIf(false)
    setShowReport(false)
    setSavedNotice(null)
  }

  const handleSaveComparison = () => {
    const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
    const outcome = addToComparison({ features: payload, predictedPriceUsd: result.predicted_price_usd })
    setSavedNotice(outcome.ok ? 'Saved to Comparison.' : outcome.error)
  }

  const handleSaveHistory = async (houseId) => {
    // Always send the exact features the user just previewed (not the
    // house's stored values) -- picking a house here only links the
    // record for organization, it shouldn't silently re-run the model on
    // different numbers than what's on screen.
    const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
    try {
      await api.predictions.create({ features: payload, ...(houseId ? { house_id: Number(houseId) } : {}) })
      showToast('Saved to prediction history', 'success')
    } catch (err) {
      showToast(err.message, 'error')
      throw err
    }
  }

  if (phase === 'loading') {
    return <LoadingStages />
  }

  if (phase === 'error') {
    return <ErrorState message={submitError} onRetry={submit} />
  }

  if (phase === 'result') {
    const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
    if (showReport) {
      return <ValuationReport features={payload} result={result} onClose={() => setShowReport(false)} />
    }
    return (
      <div className="valuation-flow__result-stack">
        <PredictionResult
          result={result}
          isGuest={!user}
          onWhatIf={() => setShowWhatIf((s) => !s)}
          onSaveComparison={handleSaveComparison}
          onSaveHistory={handleSaveHistory}
          onReport={() => setShowReport(true)}
          onNewValuation={restart}
        />
        {savedNotice && <p className="valuation-flow__notice">{savedNotice}</p>}
        {showWhatIf && (
          <WhatIfSimulator
            baseFeatures={payload}
            baseValue={result.predicted_price_usd}
            onClose={() => setShowWhatIf(false)}
          />
        )}
        <WhyThisPrice explanation={result.explanation} />
        {user ? (
          <div className="valuation-flow__footer-actions">
            <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('comparables')}>
              View Comparable Properties →
            </button>
            <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('model')}>
              View Model Performance →
            </button>
          </div>
        ) : (
          <div className="hv-card valuation-flow__guest-cta">
            <p className="valuation-flow__guest-cta-title">Like what you see?</p>
            <p className="valuation-flow__guest-cta-copy">
              Create a free account to save this prediction, find comparable properties, and build
              a history of every valuation you run.
            </p>
            <Link to="/signup" className="hv-btn hv-btn-primary">
              Create your account
            </Link>
          </div>
        )}
        <Limitations />
      </div>
    )
  }

  return (
    <div className="valuation-flow">
      <p className="hv-label">Predict</p>
      <h1 className="valuation-flow__title">What's the property like?</h1>
      <p className="valuation-flow__intro">
        Fill in what you know below, or describe it in plain language and we'll fill in the
        rest. Every value is editable before you estimate.
      </p>

      <div className="valuation-flow__mode-toggle" role="tablist" aria-label="Input method">
        <button
          type="button"
          role="tab"
          aria-selected={entryMode === 'guided'}
          className={`valuation-flow__mode-btn ${entryMode === 'guided' ? 'is-active' : ''}`}
          onClick={() => setEntryMode('guided')}
        >
          Guided form
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={entryMode === 'describe'}
          className={`valuation-flow__mode-btn ${entryMode === 'describe' ? 'is-active' : ''}`}
          onClick={() => setEntryMode('describe')}
        >
          Describe your property
        </button>
      </div>

      {entryMode === 'describe' && (
        <div className="hv-card valuation-flow__panel">
          <DescribePropertyInput
            onExtracted={(fields) => setValues((prev) => ({ ...prev, ...fields }))}
          />
        </div>
      )}

      {showErrors && errorFields.length > 0 && (
        <div
          id="valuation-flow-error-summary"
          className="valuation-flow__error-summary"
          role="alert"
          tabIndex={-1}
        >
          <p className="valuation-flow__error-summary-title">
            {errorFields.length === 1 ? 'One field needs' : `${errorFields.length} fields need`} attention:
          </p>
          <ul>
            {errorFields.map((name) => (
              <li key={name}>
                <a href={`#field-${name}`}>{FIELD_META[name].label}</a>: {errors[name]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {SECTIONS.map((section) => (
        <fieldset key={section.key} className="hv-card valuation-flow__panel valuation-flow__section">
          <legend className="valuation-flow__section-title">{section.title}</legend>
          {section.key === 'location' && (
            <CaliforniaMap
              latitude={values.Latitude}
              longitude={values.Longitude}
              onPick={({ lat, lon }) =>
                setValues((prev) => ({ ...prev, Latitude: lat.toFixed(4), Longitude: lon.toFixed(4) }))
              }
            />
          )}
          <div className="valuation-flow__fields">
            {section.fields.map((name) => (
              <FieldInput
                key={name}
                name={name}
                value={values[name]}
                onChange={handleChange}
                error={showErrors ? errors[name] : undefined}
                warning={warnings[name]}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="valuation-flow__submit-row">
        <button type="button" className="hv-btn hv-btn-primary valuation-flow__submit" onClick={handleEstimateClick}>
          Estimate value
        </button>
      </div>
    </div>
  )
}
