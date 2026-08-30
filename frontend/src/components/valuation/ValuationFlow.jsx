import { useState } from 'react'
import FieldInput from './FieldInput'
import CaliforniaMap from './CaliforniaMap'
import PropertySummary from './PropertySummary'
import PredictionResult from './PredictionResult'
import LoadingStages from './LoadingStages'
import ModelExplainability from './ModelExplainability'
import WhatIfSimulator from './WhatIfSimulator'
import ValuationReport from './ValuationReport'
import Limitations from '../Limitations'
import ErrorState from '../ErrorState'
import { STEPS, EXAMPLE_PROPERTY, FALLBACK_RANGES } from '../../lib/fields'
import { validateFeatures } from '../../lib/validation'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { addHistoryEntry, addToComparison } from '../../lib/storage'
import './ValuationFlow.css'

function toRangeMap(datasetStats) {
  if (!datasetStats) return FALLBACK_RANGES
  return Object.fromEntries(
    Object.entries(datasetStats.features).map(([name, s]) => [name, { p1: s.p1, p99: s.p99 }])
  )
}

export default function ValuationFlow({ setView }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState(EXAMPLE_PROPERTY)
  const [showErrors, setShowErrors] = useState(false)
  const [phase, setPhase] = useState('form') // form | loading | result | error
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [savedNotice, setSavedNotice] = useState(null)

  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const ranges = toRangeMap(datasetStats)
  const { errors, warnings } = validateFeatures(values, ranges)

  const step = STEPS[stepIndex]
  const isReview = step.key === 'review'

  const handleChange = (name, raw) => setValues((prev) => ({ ...prev, [name]: raw }))

  const stepHasErrors = step.fields.some((f) => errors[f])

  const goNext = () => {
    if (stepHasErrors) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  const submit = async () => {
    setPhase('loading')
    setSubmitError(null)
    try {
      const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)]))
      const res = await api.predict(payload)
      setResult(res)
      addHistoryEntry({ features: payload, predictedPriceUsd: res.predicted_price_usd, warnings: res.warnings })
      setPhase('result')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong while valuing this property.')
      setPhase('error')
    }
  }

  const restart = () => {
    setPhase('form')
    setStepIndex(0)
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
          onWhatIf={() => setShowWhatIf((s) => !s)}
          onSaveComparison={handleSaveComparison}
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
        <ModelExplainability />
        <div className="valuation-flow__footer-actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('model')}>
            View Model Performance →
          </button>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('compare')}>
            Compare Properties →
          </button>
        </div>
        <Limitations />
      </div>
    )
  }

  return (
    <div className="valuation-flow">
      <ol className="valuation-flow__progress" aria-label="Valuation steps">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i === stepIndex ? 'is-active' : i < stepIndex ? 'is-done' : ''}>
            {s.title}
          </li>
        ))}
      </ol>

      <div className="hv-card valuation-flow__panel">
        <h2 className="valuation-flow__step-title">{step.title}</h2>

        {!isReview && (
          <>
            {step.key === 'location' && (
              <CaliforniaMap
                latitude={values.Latitude}
                longitude={values.Longitude}
                onPick={({ lat, lon }) =>
                  setValues((prev) => ({ ...prev, Latitude: lat.toFixed(4), Longitude: lon.toFixed(4) }))
                }
              />
            )}
            <div className="valuation-flow__fields">
              {step.fields.map((name) => (
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
          </>
        )}

        {isReview && (
          <>
            <PropertySummary features={values} />
            {Object.keys(errors).length > 0 && (
              <p className="valuation-flow__review-error">
                Some values still need attention. Go back and correct them before estimating.
              </p>
            )}
          </>
        )}

        <div className="valuation-flow__nav">
          {stepIndex > 0 && (
            <button type="button" className="hv-btn hv-btn-secondary" onClick={goBack}>
              {isReview ? 'Edit' : 'Back'}
            </button>
          )}
          {!isReview && (
            <button type="button" className="hv-btn hv-btn-primary" onClick={goNext}>
              Continue
            </button>
          )}
          {isReview && (
            <button
              type="button"
              className="hv-btn hv-btn-primary"
              onClick={submit}
              disabled={Object.keys(errors).length > 0}
            >
              Estimate Value
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
