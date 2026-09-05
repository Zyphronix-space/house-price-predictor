import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import ErrorState from '../ErrorState'
import './ErrorAnalysis.css'

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`

export default function ErrorAnalysis() {
  const { data, error, loading } = useAsync(() => api.evaluationSample(), [])

  if (loading) return <div className="hv-card hv-skeleton error-analysis--loading" aria-hidden="true" />
  if (error) return <ErrorState message={error.message} />

  return (
    <section className="error-analysis">
      <div className="hv-card error-analysis__summary">
        <p className="hv-label">Average error (MAE)</p>
        <p className="error-analysis__mae">{fmtUsd(data.mae_usd)}</p>
        <p className="error-analysis__note">
          The model performs differently across properties, and individual predictions
          can have substantially larger errors than the average. The table below shows
          the largest misses observed on the test set.
        </p>
      </div>

      <div className="hv-card error-analysis__table-wrap">
        <p className="hv-label error-analysis__table-title">Largest errors on the test set</p>
        <table className="error-analysis__table">
          <thead>
            <tr>
              <th scope="col">Actual</th>
              <th scope="col">Predicted</th>
              <th scope="col">Error</th>
              <th scope="col">Income</th>
              <th scope="col">Rooms</th>
              <th scope="col">Location</th>
            </tr>
          </thead>
          <tbody>
            {data.largest_errors.map((row, i) => (
              <tr key={i}>
                <td>{fmtUsd(row.actual_usd)}</td>
                <td>{fmtUsd(row.predicted_usd)}</td>
                <td className="error-analysis__error-cell">{fmtUsd(row.error_usd)}</td>
                <td>${Math.round(row.features.MedInc * 10_000).toLocaleString()}</td>
                <td>{row.features.AveRooms.toFixed(1)}</td>
                <td>
                  {row.features.Latitude.toFixed(2)}°, {row.features.Longitude.toFixed(2)}°
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
