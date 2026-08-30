import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import ErrorState from '../ErrorState'
import './ModelCheck.css'

const W = 480
const H = 480
const PAD = 44

const fmtUsd = (v) => (Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`)

export default function ModelCheck() {
  const { data, error, loading } = useAsync(() => api.evaluationSample(), [])

  if (loading) return <div className="model-check--loading" aria-hidden="true" />
  if (error) return <ErrorState message={error.message} />

  const values = data.sample.flatMap((p) => [p.actual_usd, p.predicted_usd])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const scale = (v) => PAD + ((v - min) / (max - min)) * (W - 2 * PAD)
  const scaleY = (v) => H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD)

  const ticks = [min, min + (max - min) / 2, max]

  return (
    <section className="model-check">
      <div className="model-check__stats">
        <div className="hv-card model-check__stat">
          <p className="hv-label">MAE</p>
          <p className="model-check__stat-value">${data.mae_usd.toLocaleString()}</p>
        </div>
        <div className="hv-card model-check__stat">
          <p className="hv-label">R²</p>
          <p className="model-check__stat-value">{data.r2}</p>
        </div>
      </div>
      <p className="model-check__explainer">
        <strong>MAE</strong> is the average absolute prediction error in dollars.{' '}
        <strong>R²</strong> is the share of variance in actual values the model explains
        on this held-out test set — not "accuracy."
      </p>

      <div className="hv-card model-check__chart-card">
        <p className="hv-label">Actual vs Predicted</p>
        <svg
          className="model-check__svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Scatter plot of actual versus predicted median house values on the test set. Points closer to the diagonal line are more accurate."
        >
          <line x1={PAD} y1={H - PAD} x2={PAD} y2={PAD} className="model-check__axis" />
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="model-check__axis" />
          <line
            x1={scale(min)} y1={scaleY(min)} x2={scale(max)} y2={scaleY(max)}
            className="model-check__diagonal"
          />
          {data.sample.map((p, i) => (
            <circle
              key={i}
              cx={scale(p.actual_usd)}
              cy={scaleY(p.predicted_usd)}
              r="3"
              className="model-check__dot"
            >
              <title>{`Actual ${fmtUsd(p.actual_usd)} · Predicted ${fmtUsd(p.predicted_usd)}`}</title>
            </circle>
          ))}
          {ticks.map((t, i) => (
            <text key={`x${i}`} x={scale(t)} y={H - PAD + 18} className="model-check__tick" textAnchor="middle">
              {fmtUsd(t)}
            </text>
          ))}
          {ticks.map((t, i) => (
            <text key={`y${i}`} x={PAD - 8} y={scaleY(t) + 4} className="model-check__tick" textAnchor="end">
              {fmtUsd(t)}
            </text>
          ))}
          <text x={W / 2} y={H - 4} className="model-check__axis-label" textAnchor="middle">
            Actual value
          </text>
          <text
            x={-H / 2} y={12}
            className="model-check__axis-label"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            Predicted value
          </text>
        </svg>
        <p className="model-check__caption">
          {data.sample.length.toLocaleString()} test-set properties. Points on the diagonal are exact
          matches; the further a point sits from it, the larger that prediction's error.
        </p>
      </div>
    </section>
  )
}
