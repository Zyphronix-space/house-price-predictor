import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FieldInput from './FieldInput'
import CaliforniaMap from './CaliforniaMap'
import PredictionResult from './PredictionResult'
import WhyThisPrice from './WhyThisPrice'
import WhatIfSimulator from './WhatIfSimulator'
import ValuationReport from './ValuationReport'
import DescribePropertyInput from './DescribePropertyInput'
import DatasetPositionChart from '../dashboard/DatasetPositionChart'
import Limitations from '../Limitations'
import { SECTIONS, FIELD_META, EXAMPLE_PROPERTY, FALLBACK_RANGES, FEATURE_ORDER } from '../../lib/fields'
import { validateFeatures } from '../../lib/validation'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/authContext'
import { addToComparison } from '../../lib/storage'
import { formatUsd } from '../../lib/format'
import { showToast } from '../../lib/toast'
import './ValuationFlow.css'

function toRangeMap(datasetStats) {
  if (!datasetStats) return FALLBACK_RANGES
  return Object.fromEntries(
    Object.entries(datasetStats.features).map(([name, s]) => [name, { p1: s.p1, p99: s.p99 }])
  )
}

const toPayload = (values) => Object.fromEntries(FEATURE_ORDER.map((k) => [k, Number(values[k])]))

const samePayload = (a, b) => Boolean(a && b) && FEATURE_ORDER.every((k) => a[k] === b[k])

function scrollIntoViewOnNarrow(el) {
  if (!el || !window.matchMedia('(max-width: 1024px)').matches) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
}

export default function ValuationFlow({ setView }) {
  const { user } = useAuth()
  const [values, setValues] = useState(EXAMPLE_PROPERTY)
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  // The exact numbers the current result was computed from, so the result
  // can be flagged as out of date once any input changes.
  const [resultInputs, setResultInputs] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [entryMode, setEntryMode] = useState('guided') // 'guided' | 'describe'
  const resultRef = useRef(null)
  const errorSummaryRef = useRef(null)
  // Bumped on every blocked submit so the summary takes focus each time,
  // after it has rendered.
  const [blockedSubmits, setBlockedSubmits] = useState(0)

  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const ranges = toRangeMap(datasetStats)
  const { errors, warnings, isValid } = validateFeatures(values, ranges)
  const errorFields = Object.keys(errors)
  const stale = Boolean(result) && (!isValid || !samePayload(toPayload(values), resultInputs))

  useEffect(() => {
    if (blockedSubmits > 0) errorSummaryRef.current?.focus()
  }, [blockedSubmits])

  const handleChange = (name, raw) => setValues((prev) => ({ ...prev, [name]: raw }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (submitting) return
    if (!isValid) {
      setShowErrors(true)
      setBlockedSubmits((n) => n + 1)
      return
    }
    submit()
  }

  const submit = async () => {
    const payload = toPayload(values)
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await api.predict(payload)
      setResult(res)
      setResultInputs(payload)
      setShowWhatIf(false)
      requestAnimationFrame(() => scrollIntoViewOnNarrow(resultRef.current))
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong while estimating this property.')
      requestAnimationFrame(() => scrollIntoViewOnNarrow(resultRef.current))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveComparison = () => {
    const outcome = addToComparison({ features: resultInputs, predictedPriceUsd: result.predicted_price_usd })
    showToast(outcome.ok ? 'Added to comparison' : outcome.error, outcome.ok ? 'success' : 'error')
  }

  const handleSaveHistory = async (houseId) => {
    // Always send the exact features the shown estimate came from (not
    // the house's stored values) -- picking a house only links the record,
    // it shouldn't silently re-run the model on different numbers.
    try {
      await api.predictions.create({ features: resultInputs, ...(houseId ? { house_id: Number(houseId) } : {}) })
      showToast('Saved to prediction history', 'success')
    } catch (err) {
      showToast(err.message, 'error')
      throw err
    }
  }

  const resetToExample = () => {
    setValues(EXAMPLE_PROPERTY)
    setShowErrors(false)
  }

  if (showReport && result) {
    return <ValuationReport features={resultInputs} result={result} onClose={() => setShowReport(false)} />
  }

  return (
    <div className="vf">
      <header className="vf__header">
        <h1 className="vf__title">Estimate a property</h1>
        <p className="vf__lede">
          The model describes census block groups, neighbourhood-sized areas of typically 600 to 3,000
          people, rather than single houses. Enter the area's figures and it estimates the median
          home value there.
        </p>
      </header>

      <div className="vf__workspace">
        <form className="vf__form" onSubmit={handleSubmit} noValidate aria-label="Property inputs">
          <div className="vf__modes" role="tablist" aria-label="Input method">
            <button
              type="button"
              role="tab"
              aria-selected={entryMode === 'guided'}
              className={`vf__mode ${entryMode === 'guided' ? 'is-active' : ''}`}
              onClick={() => setEntryMode('guided')}
            >
              Enter figures
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={entryMode === 'describe'}
              className={`vf__mode ${entryMode === 'describe' ? 'is-active' : ''}`}
              onClick={() => setEntryMode('describe')}
            >
              Describe in words
            </button>
          </div>

          {entryMode === 'describe' && (
            <div className="vf__describe">
              <DescribePropertyInput onExtracted={(fields) => setValues((prev) => ({ ...prev, ...fields }))} />
            </div>
          )}

          {showErrors && errorFields.length > 0 && (
            <div ref={errorSummaryRef} className="vf__error-summary" role="alert" tabIndex={-1}>
              <p className="vf__error-summary-title">
                {errorFields.length === 1 ? 'One field needs' : `${errorFields.length} fields need`} attention
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
            <fieldset key={section.key} className={`vf__section vf__section--${section.key}`}>
              <legend className="vf__section-title">{section.title}</legend>
              <div className="vf__section-body">
                {section.key === 'location' && (
                  <CaliforniaMap
                    latitude={values.Latitude}
                    longitude={values.Longitude}
                    onPick={({ lat, lon }) =>
                      setValues((prev) => ({ ...prev, Latitude: lat.toFixed(4), Longitude: lon.toFixed(4) }))
                    }
                  />
                )}
                <div className="vf__fields">
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
              </div>
            </fieldset>
          ))}

          <div className="vf__submit-row">
            <button type="button" className="hv-btn hv-btn-ghost" onClick={resetToExample} disabled={submitting}>
              Reset to example
            </button>
            <button type="submit" className="hv-btn hv-btn-primary vf__submit" disabled={submitting} aria-busy={submitting}>
              {submitting && <span className="hv-spinner" aria-hidden="true" />}
              {submitting ? 'Estimating' : result ? 'Re-run estimate' : 'Estimate value'}
            </button>
          </div>
        </form>

        <aside className="vf__aside" ref={resultRef} aria-label="Estimate">
          {submitError && (
            <div className="vf__error" role="alert">
              <p className="vf__error-title">The estimate could not be completed</p>
              <p>{submitError}</p>
              <button type="button" className="hv-btn hv-btn-secondary" onClick={submit} disabled={submitting}>
                Try again
              </button>
            </div>
          )}

          {result ? (
            <PredictionResult
              result={result}
              inputs={resultInputs}
              stale={stale}
              isGuest={!user}
              onWhatIf={() => setShowWhatIf((s) => !s)}
              onSaveComparison={handleSaveComparison}
              onSaveHistory={handleSaveHistory}
              onReport={() => setShowReport(true)}
            />
          ) : submitting ? (
            <div className="vf__placeholder" aria-hidden="true">
              <span className="hv-skeleton vf__skeleton vf__skeleton--label" />
              <span className="hv-skeleton vf__skeleton vf__skeleton--value" />
              <span className="hv-skeleton vf__skeleton vf__skeleton--line" />
              <span className="hv-skeleton vf__skeleton vf__skeleton--line" />
            </div>
          ) : (
            !submitError && (
              <div className="vf__placeholder">
                <p className="vf__placeholder-title">Your estimate will appear here</p>
                <p>
                  You will see the estimated median home value, the range this model's errors
                  typically fall within, and which inputs pushed the value up or down.
                </p>
                <p className="vf__placeholder-note">
                  The form starts with rounded figures from a real block group in the dataset
                  (Berkeley) so you can run it straight away.
                </p>
              </div>
            )
          )}
        </aside>
      </div>

      {result && !stale && (
        <div className="vf__details">
          {showWhatIf && (
            <WhatIfSimulator
              baseFeatures={resultInputs}
              baseValue={result.predicted_price_usd}
              onClose={() => setShowWhatIf(false)}
            />
          )}

          <div className="vf__details-grid">
            <WhyThisPrice explanation={result.explanation} />

            {datasetStats && (
              <section className="vf__panel" aria-labelledby="vf-context-title">
                <h2 id="vf-context-title" className="vf__panel-title">Compared with the training data</h2>
                <DatasetPositionChart
                  histogram={datasetStats.target.histogram}
                  cappedAt={datasetStats.target.capped_at_usd}
                  markers={[{ value: result.predicted_price_usd, label: `This estimate ${formatUsd(result.predicted_price_usd)}`, emphasis: true }]}
                  caption={`Median home values of the ${datasetStats.n_records.toLocaleString()} block groups the model learned from.`}
                />
              </section>
            )}
          </div>

          {user ? (
            <nav className="vf__next" aria-label="Next steps">
              <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('comparables')}>
                Comparable block groups
              </button>
              <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('model')}>
                Model performance
              </button>
            </nav>
          ) : (
            <section className="vf__guest">
              <div>
                <p className="vf__panel-title">Keep this estimate</p>
                <p className="vf__guest-copy">
                  With a free account you can save estimates, compare them side by side and find the
                  most similar real block groups.
                </p>
              </div>
              <Link to="/signup" className="hv-btn hv-btn-primary">
                Create an account
              </Link>
            </section>
          )}

          <Limitations />
        </div>
      )}
    </div>
  )
}
