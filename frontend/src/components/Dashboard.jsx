import { useState } from 'react'
import { api } from '../lib/api'
import { useAsync } from '../lib/hooks'
import { getComparison } from '../lib/storage'
import { formatDateTime, formatUsd, timeAgo } from '../lib/format'
import DatasetPositionChart from './dashboard/DatasetPositionChart'
import Onboarding, { shouldShowOnboarding } from './Onboarding'
import './Dashboard.css'

const TOOLS = [
  { key: 'comparables', label: 'Comparable block groups', desc: 'Nearest real records to your latest estimate' },
  { key: 'whatif', label: 'What-if simulator', desc: 'Change one input and re-run the model' },
  { key: 'compare', label: 'Compare estimates', desc: 'Side-by-side view of saved estimates' },
  { key: 'investment', label: 'Investment calculator', desc: 'Mortgage, cash flow and return' },
  { key: 'analysis', label: 'Dataset analysis', desc: 'Distributions and correlations in the training data' },
  { key: 'model', label: 'Model performance', desc: 'Model comparison, cross-validation, error analysis' },
]

function formatLocation(features) {
  if (!features || features.Latitude == null) return '-'
  return `${Number(features.Latitude).toFixed(2)}, ${Number(features.Longitude).toFixed(2)}`
}

export default function Dashboard({ setView }) {
  const { data: summary, loading: summaryLoading } = useAsync(() => api.dashboardSummary(), [])
  const { data: predictionsRes, loading: predictionsLoading } = useAsync(() => api.predictions.list(), [])
  const { data: datasetStats } = useAsync(() => api.datasetStats(), [])
  const { data: modelInfo } = useAsync(() => api.modelInfo(), [])
  // Lazy init reads localStorage once, synchronously, before first paint --
  // avoids a flash where the dashboard renders first and the tour pops in
  // a beat later.
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding)

  const predictions = [...(predictionsRes?.predictions ?? [])].sort(
    (a, b) => (a.created_at < b.created_at ? 1 : -1)
  )
  const recent = predictions.slice(0, 6)
  const latest = predictions[0]
  const comparisonCount = getComparison().length
  const loading = summaryLoading || predictionsLoading
  const isEmpty = !loading && predictions.length === 0

  return (
    <div className="dash">
      <header className="dash__header">
        <div>
          <h1 className="dash__title">Property valuation</h1>
          <p className="dash__lede">
            Estimate the median home value of a California census block group from eight
            neighbourhood statistics, then save, compare and explain the result.
          </p>
        </div>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Estimate a property
        </button>
      </header>

      <dl className="dash__summary" aria-busy={loading}>
        <div className="dash__summary-item">
          <dt>Estimates run</dt>
          <dd className="hv-tabular">{summary ? summary.total_predictions.toLocaleString() : '–'}</dd>
        </div>
        <div className="dash__summary-item">
          <dt>Average estimate</dt>
          <dd className="hv-tabular">
            {summary?.average_predicted_price_usd != null ? formatUsd(summary.average_predicted_price_usd) : '–'}
          </dd>
        </div>
        <div className="dash__summary-item">
          <dt>Saved properties</dt>
          <dd className="hv-tabular">{summary ? summary.total_properties.toLocaleString() : '–'}</dd>
        </div>
        <div className="dash__summary-item">
          <dt>Last estimate</dt>
          <dd>{latest ? timeAgo(latest.created_at) : loading ? '–' : 'None yet'}</dd>
        </div>
      </dl>

      {isEmpty ? (
        <section className="dash__empty">
          <h2 className="dash__section-title">No estimates yet</h2>
          <p>
            Enter a block group's median income, housing age, room counts, population and location.
            The model returns an estimated median home value, an empirical error range and the
            features that moved it. Saved estimates appear here.
          </p>
          <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
            Run your first estimate
          </button>
        </section>
      ) : (
        <div className="dash__grid">
          <section className="dash__panel dash__recent" aria-labelledby="dash-recent-title">
            <div className="dash__panel-head">
              <h2 id="dash-recent-title" className="dash__section-title">Recent estimates</h2>
              <button type="button" className="dash__text-link" onClick={() => setView('history')}>
                All history
              </button>
            </div>
            <div className="dash__table-wrap">
              <table className="dash__table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className="is-wide-only">Location (lat, long)</th>
                    <th scope="col" className="is-wide-only">Property</th>
                    <th scope="col" className="is-num">Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: 3 }, (_, i) => (
                      <tr key={i} aria-hidden="true">
                        <td colSpan={4}>
                          <span className="hv-skeleton dash__skeleton-row" />
                        </td>
                      </tr>
                    ))}
                  {recent.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDateTime(p.created_at)}</td>
                      <td className="hv-tabular is-wide-only">{formatLocation(p.features)}</td>
                      <td className="is-wide-only">{summary?.recent_predictions.find((r) => r.id === p.id)?.house_label ?? <span className="dash__muted">Unlinked</span>}</td>
                      <td className="is-num hv-tabular">{formatUsd(p.predicted_price_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dash__panel dash__position" aria-labelledby="dash-position-title">
            <div className="dash__panel-head">
              <h2 id="dash-position-title" className="dash__section-title">Your estimates in context</h2>
            </div>
            {datasetStats ? (
              <DatasetPositionChart
                histogram={datasetStats.target.histogram}
                cappedAt={datasetStats.target.capped_at_usd}
                markers={predictions.slice(0, 20).map((p, i) => ({
                  value: p.predicted_price_usd,
                  label: i === 0 ? `Latest ${formatUsd(p.predicted_price_usd)}` : undefined,
                  emphasis: i === 0,
                }))}
                caption={`Grey bars: median home values of all ${datasetStats.n_records.toLocaleString()} block groups the model was trained on. Green lines: your ${Math.min(predictions.length, 20)} most recent estimates.`}
              />
            ) : (
              <span className="hv-skeleton dash__skeleton-chart" aria-hidden="true" />
            )}
          </section>
        </div>
      )}

      <div className="dash__grid dash__grid--secondary">
        <section className="dash__panel" aria-labelledby="dash-tools-title">
          <h2 id="dash-tools-title" className="dash__section-title">Tools</h2>
          <ul className="dash__tools">
            {TOOLS.map((tool) => (
              <li key={tool.key}>
                <button type="button" className="dash__tool" onClick={() => setView(tool.key)}>
                  <span className="dash__tool-label">
                    {tool.label}
                    {tool.key === 'compare' && comparisonCount > 0 && (
                      <span className="dash__count">{comparisonCount} saved</span>
                    )}
                  </span>
                  <span className="dash__tool-desc">{tool.desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash__panel" aria-labelledby="dash-model-title">
          <h2 id="dash-model-title" className="dash__section-title">About the model</h2>
          <dl className="dash__facts">
            <div>
              <dt>Model</dt>
              <dd>{modelInfo?.model_name ?? '–'}</dd>
            </div>
            <div>
              <dt>Mean absolute error (test set)</dt>
              <dd className="hv-tabular">{modelInfo ? formatUsd(modelInfo.metrics.mae_usd) : '–'}</dd>
            </div>
            <div>
              <dt>R² (test set)</dt>
              <dd className="hv-tabular">{modelInfo ? modelInfo.metrics.r2.toFixed(3) : '–'}</dd>
            </div>
            <div>
              <dt>Training data</dt>
              <dd>
                {modelInfo?.dataset ?? '–'}
                {datasetStats ? `, ${datasetStats.n_records.toLocaleString()} block groups (1990 census)` : ''}
              </dd>
            </div>
          </dl>
          <p className="dash__note">
            Estimates are model output, not appraisals or sale prices. Values are in the dataset's
            own 1990 US dollars.
          </p>
        </section>
      </div>

      <Onboarding open={showOnboarding} onDone={() => setShowOnboarding(false)} />
    </div>
  )
}
