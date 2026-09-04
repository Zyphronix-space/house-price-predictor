import { useState } from 'react'
import ScatterChart from './ScatterChart'
import CorrelationHeatmap from './CorrelationHeatmap'
import ResidualHistogram from './ResidualHistogram'
import DistributionChart from '../model/DistributionChart'
import ModelExplainability from '../valuation/ModelExplainability'
import ModelCheck from '../model/ModelCheck'
import ErrorState from '../ErrorState'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import './Analysis.css'

const fmtUsd = (v) => (Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`)

function Overview({ datasetStats, sample }) {
  return (
    <div className="analysis__grid">
      <DistributionChart stats={datasetStats} />
      <ScatterChart
        title="Price vs Average Rooms"
        points={sample.map((r) => ({ x: r.features.AveRooms, y: r.price_usd }))}
        xLabel="Average rooms / household"
        yLabel="Median house value"
        yFormat={fmtUsd}
        xFormat={(v) => v.toFixed(1)}
      />
      <ScatterChart
        title="Price vs Average Bedrooms"
        points={sample.map((r) => ({ x: r.features.AveBedrms, y: r.price_usd }))}
        xLabel="Average bedrooms / household"
        yLabel="Median house value"
        yFormat={fmtUsd}
        xFormat={(v) => v.toFixed(1)}
      />
      <ScatterChart
        title="Price vs House Age"
        points={sample.map((r) => ({ x: r.features.HouseAge, y: r.price_usd }))}
        xLabel="Median house age (block group)"
        yLabel="Median house value"
        yFormat={fmtUsd}
        xFormat={(v) => v.toFixed(0)}
      />
    </div>
  )
}

const SECTIONS = ['Overview', 'Correlations', 'Model Fit']

export default function Analysis() {
  const [section, setSection] = useState('Overview')
  const { data: datasetStats, error: statsError, loading: statsLoading } = useAsync(() => api.datasetStats(), [])
  const { data: sampleData, error: sampleError, loading: sampleLoading } = useAsync(() => api.datasetSample(), [])
  const { data: evalData } = useAsync(() => api.evaluationSample(), [])

  const loading = statsLoading || sampleLoading
  const error = statsError || sampleError

  return (
    <section className="analysis">
      <p className="hv-label analysis__title">Analysis Dashboard</p>
      <p className="analysis__intro">
        Real, computed views of the training data and the served model's behavior — nothing
        here is illustrative or hardcoded.
      </p>

      <nav className="analysis__tabs" aria-label="Analysis sections">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={`analysis__tab ${section === s ? 'is-active' : ''}`}
            aria-current={section === s ? 'page' : undefined}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
      </nav>

      {loading && <div className="analysis__loading" aria-hidden="true" />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && (
        <>
          {section === 'Overview' && <Overview datasetStats={datasetStats} sample={sampleData.rows} />}
          {section === 'Correlations' && (
            <div className="analysis__grid analysis__grid--wide">
              <CorrelationHeatmap correlation={datasetStats.feature_correlation} />
              <ModelExplainability />
            </div>
          )}
          {section === 'Model Fit' && (
            <div className="analysis__grid analysis__grid--wide">
              <ModelCheck />
              {evalData && <ResidualHistogram histogram={evalData.residual_histogram} />}
            </div>
          )}
        </>
      )}
    </section>
  )
}
