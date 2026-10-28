import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import FieldInput from './FieldInput'
import CaliforniaMap from './CaliforniaMap'
import PredictionResult from './PredictionResult'
import WhyThisPrice from './WhyThisPrice'
import WhatIfSimulator from './WhatIfSimulator'
import ValuationReport from './ValuationReport'
import DescribePropertyInput from './DescribePropertyInput'
import DatasetPositionChart from '../dashboard/DatasetPositionChart'
import Limitations from '../Limitations'
import { FIELD_META, FALLBACK_RANGES, FEATURE_ORDER } from '../../lib/fields'
import { validateFeatures } from '../../lib/validation'
import { api, ApiError } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { useAuth } from '../../lib/authContext'
import { addToComparison, getLastEstimate, isInComparison, setLastEstimate } from '../../lib/storage'
import { formatUsd } from '../../lib/format'
import { showToast } from '../../lib/toast'
import { PLACES, findPlace } from '../../lib/places'
import { nearestNeighbourhood } from '../../lib/neighbourhood'
import { AREA_FACTS, unusualFigures } from '../../lib/plainLanguage'
import './ValuationFlow.css'

// "Describe in words" needs GEMINI_API_KEY on the API, which production
// doesn't have yet. It stays hidden until a build opts in, so nobody is
// offered a feature that can only fail.
const DESCRIBE_ENABLED = import.meta.env.VITE_ENABLE_DESCRIBE === 'true'

const QUICK_PLACES = ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento']

function toRangeMap(datasetStats) {
  if (!datasetStats) return FALLBACK_RANGES
  return Object.fromEntries(
    Object.entries(datasetStats.features).map(([name, s]) => [name, { p1: s.p1, p99: s.p99 }])
  )
}

const toPayload = (values) => Object.fromEntries(FEATURE_ORDER.map((k) => [k, Number(values[k])]))

const samePayload = (a, b) => Boolean(a && b) && FEATURE_ORDER.every((k) => a[k] === b[k])

function friendlyError(err) {
  if (!(err instanceof ApiError) || err.status === null) {
    return "We couldn't reach the estimate service. Check your connection and try again."
  }
  if (err.status === 422) return 'Some of the figures were not accepted. Check them under "Adjust the figures" and try again.'
  if (err.status === 429) return "You've made a lot of estimates in a short time. Please wait a few minutes and try again."
  return 'The estimate service ran into a problem. Please try again in a moment.'
}

function scrollIntoView(el) {
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
}

export default function ValuationFlow({ setView }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  // The last estimate made in this tab, so a detour through sign-in (or a
  // reload) doesn't throw the visitor's work away.
  const [restored] = useState(() => getLastEstimate())
  // Where the figures came from: { label, shortLabel, distanceKm } once a
  // place is chosen. shortLabel names the area in lists (comparison).
  const [area, setArea] = useState(restored?.area ?? null)
  const [placeQuery, setPlaceQuery] = useState('')
  const [lookupError, setLookupError] = useState(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [mapPoint, setMapPoint] = useState(null)
  const [values, setValues] = useState(restored?.values ?? null)
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(restored?.result ?? null)
  // The exact numbers the current result was computed from, so the result
  // can be flagged as out of date once any input changes.
  const [resultInputs, setResultInputs] = useState(restored?.resultInputs ?? null)
  const [inComparison, setInComparison] = useState(() => Boolean(restored && isInComparison(restored.resultInputs)))
  const [submitError, setSubmitError] = useState(null)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const areaRef = useRef(null)
  const resultRef = useRef(null)
  const errorSummaryRef = useRef(null)
  // Bumped on every blocked submit so the summary takes focus each time,
  // after it has rendered.
  const [blockedSubmits, setBlockedSubmits] = useState(0)

  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const ranges = toRangeMap(datasetStats)
  const validation = values ? validateFeatures(values, ranges) : { errors: {}, warnings: {}, isValid: false }
  const { errors, warnings, isValid } = validation
  const errorFields = Object.keys(errors)
  const stale = Boolean(result) && (!isValid || !samePayload(toPayload(values), resultInputs))

  useEffect(() => {
    if (blockedSubmits > 0) errorSummaryRef.current?.focus()
  }, [blockedSubmits])

  const loadArea = async (lat, lon, label, shortLabel) => {
    setLookingUp(true)
    setLookupError(null)
    try {
      const found = await nearestNeighbourhood(lat, lon, ranges)
      setValues(Object.fromEntries(FEATURE_ORDER.map((k) => [k, String(found.features[k])])))
      setArea({ label, shortLabel, distanceKm: found.distanceKm })
      setShowErrors(false)
      setSubmitError(null)
      requestAnimationFrame(() => scrollIntoView(areaRef.current))
    } catch {
      setLookupError("We couldn't load the neighbourhood data. Check your connection and try again.")
    } finally {
      setLookingUp(false)
    }
  }

  const choosePlace = (name) => {
    const place = findPlace(name)
    if (!place) {
      setLookupError(
        name.trim()
          ? `We don't have "${name.trim()}" in our list yet. Pick a nearby city from the suggestions, or tap its location on the map.`
          : 'Type a California city, or tap a location on the map.'
      )
      return
    }
    setPlaceQuery(place.name)
    setMapPoint(null)
    loadArea(place.lat, place.lon, place.name, place.name)
  }

  // /predict?place=Fresno (the landing page's city links) starts the flow
  // for that place; the param is then dropped so a reload doesn't redo it.
  const startPlace = searchParams.get('place')
  useEffect(() => {
    if (!startPlace) return
    setSearchParams({}, { replace: true })
    choosePlace(startPlace)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per incoming link
  }, [startPlace])

  const handleChange = (name, raw) => setValues((prev) => ({ ...prev, [name]: raw }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (submitting) return
    if (!isValid) {
      setShowErrors(true)
      setAdjustOpen(true)
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
      setInComparison(isInComparison(payload))
      setLastEstimate({ area, values, result: res, resultInputs: payload })
      setShowWhatIf(false)
      requestAnimationFrame(() => scrollIntoView(resultRef.current))
    } catch (err) {
      setSubmitError(friendlyError(err))
      requestAnimationFrame(() => scrollIntoView(resultRef.current))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveComparison = () => {
    const outcome = addToComparison({
      features: resultInputs,
      predictedPriceUsd: result.predicted_price_usd,
      label: area?.shortLabel,
    })
    if (outcome.ok) setInComparison(true)
    showToast(outcome.ok ? 'Added to your comparison on this device' : outcome.error, outcome.ok ? 'success' : 'error')
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

  if (showReport && result) {
    return <ValuationReport features={resultInputs} result={result} onClose={() => setShowReport(false)} />
  }

  const distanceNote =
    area && area.distanceKm >= 0.5 ? ` about ${area.distanceKm < 10 ? area.distanceKm.toFixed(1) : Math.round(area.distanceKm)} km away` : ''

  return (
    <div className="vf">
      <header className="vf__header">
        <h1 className="vf__title">Estimate typical home values in your area</h1>
        <p className="vf__lede">
          Choose a place in California and see what homes there were typically worth, according to
          a model trained on the 1990 US census.
        </p>
        <ol className="vf__steps" aria-label="How it works">
          <li className={area ? 'is-done' : 'is-current'}>Choose a place</li>
          <li className={result && !stale ? 'is-done' : area ? 'is-current' : ''}>Check the area</li>
          <li className={result && !stale ? 'is-current' : ''}>See the estimate</li>
        </ol>
      </header>

      <section className="vf__card" aria-labelledby="vf-place-title">
        <h2 id="vf-place-title" className="vf__card-title">Where is the home?</h2>
        <form
          className="vf__place-form"
          onSubmit={(e) => {
            e.preventDefault()
            choosePlace(placeQuery)
          }}
        >
          <label className="vf__place-label" htmlFor="vf-place">
            City or town in California
          </label>
          <div className="vf__place-row">
            <input
              id="vf-place"
              className="hv-input vf__place-input"
              list="vf-place-options"
              autoComplete="off"
              placeholder="e.g. Sacramento"
              value={placeQuery}
              onChange={(e) => {
                setPlaceQuery(e.target.value)
                setLookupError(null)
              }}
              aria-describedby={lookupError ? 'vf-place-error' : undefined}
              aria-invalid={Boolean(lookupError)}
            />
            <datalist id="vf-place-options">
              {PLACES.map((p) => (
                <option key={p.name} value={p.name} />
              ))}
            </datalist>
            <button type="submit" className="hv-btn hv-btn-primary" disabled={lookingUp} aria-busy={lookingUp}>
              {lookingUp && <span className="hv-spinner" aria-hidden="true" />}
              {lookingUp ? 'Finding' : 'Find area'}
            </button>
          </div>
          <div className="vf__quick" aria-label="Popular places">
            {QUICK_PLACES.map((name) => (
              <button key={name} type="button" className="vf__chip" onClick={() => choosePlace(name)} disabled={lookingUp}>
                {name}
              </button>
            ))}
          </div>
          {lookupError && (
            <p id="vf-place-error" className="vf__inline-error" role="alert">
              {lookupError}
            </p>
          )}
        </form>

        <details className="vf__map-toggle">
          <summary>Or tap a location on a map</summary>
          <CaliforniaMap
            latitude={mapPoint?.lat}
            longitude={mapPoint?.lon}
            onPick={({ lat, lon }) => {
              setMapPoint({ lat, lon })
              setPlaceQuery('')
              loadArea(lat, lon, 'the point you chose on the map', `Map point ${lat.toFixed(2)}, ${lon.toFixed(2)}`)
            }}
          />
        </details>
      </section>

      {values && (
        <form
          ref={areaRef}
          className="vf__card vf__area"
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="vf-area-title"
        >
          <h2 id="vf-area-title" className="vf__card-title">About this neighbourhood</h2>
          <p className="vf__area-intro">
            These are the real 1990 census figures for a neighbourhood near{' '}
            <strong>{area.label}</strong>
            {distanceNote}. They describe the whole area, not one particular home.
          </p>

          <dl className="vf__facts">
            {AREA_FACTS.map((f) => (
              <div key={f.name} className="vf__fact">
                <dt>{f.label}</dt>
                <dd className="hv-tabular">{Number.isFinite(Number(values[f.name])) && values[f.name] !== '' ? f.format(Number(values[f.name])) : 'Not set'}</dd>
              </div>
            ))}
          </dl>

          <details className="vf__adjust" open={adjustOpen} onToggle={(e) => setAdjustOpen(e.currentTarget.open)}>
            <summary>Adjust the figures</summary>
            <p className="vf__adjust-note">
              Only change these if you know the area differs from the census record. They are
              neighbourhood averages, so entering one home's details here would make the estimate
              less accurate, not more.
            </p>

            {showErrors && errorFields.length > 0 && (
              <div ref={errorSummaryRef} className="vf__error-summary" role="alert" tabIndex={-1}>
                <p className="vf__error-summary-title">
                  {errorFields.length === 1 ? 'One figure needs' : `${errorFields.length} figures need`} attention
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

            {DESCRIBE_ENABLED && (
              <div className="vf__describe">
                <DescribePropertyInput onExtracted={(fields) => setValues((prev) => ({ ...prev, ...fields }))} />
              </div>
            )}

            <div className="vf__fields">
              {FEATURE_ORDER.map((name) => (
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
          </details>

          <div className="vf__submit-row">
            <button type="submit" className="hv-btn hv-btn-primary vf__submit" disabled={submitting} aria-busy={submitting}>
              {submitting && <span className="hv-spinner" aria-hidden="true" />}
              {submitting ? 'Estimating' : result ? 'Update estimate' : 'Estimate home value'}
            </button>
          </div>
        </form>
      )}

      <div ref={resultRef} className="vf__result-anchor" aria-live="polite">
        {submitError && (
          <div className="vf__error" role="alert">
            <p className="vf__error-title">We couldn't calculate an estimate</p>
            <p>{submitError}</p>
            <button type="button" className="hv-btn hv-btn-secondary" onClick={submit} disabled={submitting}>
              Try again
            </button>
          </div>
        )}

        {submitting && !result && (
          <div className="vf__card vf__placeholder" aria-hidden="true">
            <span className="hv-skeleton vf__skeleton vf__skeleton--label" />
            <span className="hv-skeleton vf__skeleton vf__skeleton--value" />
            <span className="hv-skeleton vf__skeleton vf__skeleton--line" />
          </div>
        )}

        {result && (
          <PredictionResult
            result={result}
            areaLabel={area?.label}
            unusual={unusualFigures(resultInputs, ranges)}
            stale={stale}
            isGuest={!user}
            returnPath={pathname}
            inComparison={inComparison}
            onViewComparison={() => setView('compare')}
            onWhatIf={() => setShowWhatIf((s) => !s)}
            onSaveComparison={handleSaveComparison}
            onSaveHistory={handleSaveHistory}
            onReport={() => setShowReport(true)}
          />
        )}
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

          {!user && (
            <section className="vf__guest">
              <div>
                <p className="vf__panel-title">Want to keep this estimate?</p>
                <p className="vf__guest-copy">
                  Everything on this page works without an account, and you can compare areas on
                  this device. A free account adds a saved history of estimates you can open from
                  any device, a list of properties, and similar-neighbourhood lookups. This
                  estimate stays on screen while you sign up.
                </p>
              </div>
              <Link to="/signup" state={{ from: pathname }} className="hv-btn hv-btn-secondary">
                Create a free account
              </Link>
            </section>
          )}

          <details className="vf__how">
            <summary>How the model works out this number</summary>
            <div className="vf__how-body">
              <WhyThisPrice explanation={result.explanation} />

              {datasetStats && (
                <section className="vf__panel" aria-labelledby="vf-context-title">
                  <h3 id="vf-context-title" className="vf__panel-title">Compared with the training data</h3>
                  <DatasetPositionChart
                    histogram={datasetStats.target.histogram}
                    cappedAt={datasetStats.target.capped_at_usd}
                    markers={[{ value: result.predicted_price_usd, label: `This estimate ${formatUsd(result.predicted_price_usd)}`, emphasis: true }]}
                    caption={`Median home values of the ${datasetStats.n_records.toLocaleString()} block groups the model learned from.`}
                  />
                </section>
              )}

              <section className="vf__panel" aria-labelledby="vf-inputs-title">
                <h3 id="vf-inputs-title" className="vf__panel-title">Exact model inputs</h3>
                <dl className="vf__inputs">
                  {FEATURE_ORDER.map((name) => (
                    <div key={name}>
                      <dt>{FIELD_META[name].label}</dt>
                      <dd className="hv-tabular">
                        {resultInputs[name]} <span>{FIELD_META[name].unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {user && (
                <nav className="vf__next" aria-label="More analysis">
                  <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('comparables')}>
                    Similar neighbourhoods
                  </button>
                  <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('model')}>
                    Model performance
                  </button>
                </nav>
              )}

              <Limitations />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
