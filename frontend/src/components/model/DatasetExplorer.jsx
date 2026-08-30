import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import ErrorState from '../ErrorState'
import DistributionChart from './DistributionChart'
import './DatasetExplorer.css'

export default function DatasetExplorer() {
  const { data, error, loading } = useAsync(() => api.datasetStats(), [])

  if (loading) return <div className="dataset-explorer--loading" aria-hidden="true" />
  if (error) return <ErrorState message={error.message} />

  return (
    <section className="dataset-explorer">
      <div className="dataset-explorer__stats">
        <div className="hv-card dataset-explorer__stat">
          <p className="hv-label">Records</p>
          <p className="dataset-explorer__stat-value">{data.n_records.toLocaleString()}</p>
        </div>
        <div className="hv-card dataset-explorer__stat">
          <p className="hv-label">Features</p>
          <p className="dataset-explorer__stat-value">{data.n_features}</p>
        </div>
        <div className="hv-card dataset-explorer__stat">
          <p className="hv-label">Target</p>
          <p className="dataset-explorer__stat-value dataset-explorer__stat-value--small">
            {data.target.label}
          </p>
        </div>
      </div>

      <div className="hv-card dataset-explorer__notice">
        This dataset describes California census block groups — clusters of a few
        hundred to a few thousand people — not individual home listings. Every
        prediction in this app inherits that limitation.
      </div>

      <div className="dataset-explorer__grid">
        {Object.entries(data.features).map(([name, f]) => (
          <div key={name} className="hv-card dataset-explorer__card">
            <p className="dataset-explorer__card-title">{f.label}</p>
            <p className="dataset-explorer__card-unit">{f.unit}</p>
            <div className="dataset-explorer__card-range">
              <span>{f.min}</span>
              <span className="dataset-explorer__card-track" />
              <span>{f.max}</span>
            </div>
            <p className="dataset-explorer__card-mean">mean {f.mean}</p>
          </div>
        ))}
      </div>

      <DistributionChart stats={data} />
    </section>
  )
}
