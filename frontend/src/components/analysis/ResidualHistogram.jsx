import './ResidualHistogram.css'

const W = 640
const H = 220
const PAD_L = 50
const PAD_B = 28
const PAD_T = 12
const PAD_R = 8

const fmtUsd = (v) => {
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  return `${sign}$${abs >= 1000 ? `${Math.round(abs / 1000)}k` : Math.round(abs)}`
}

// Signed-residual (predicted - actual) histogram over the full held-out
// test set -- real errors, not a fabricated "confidence" visualization.
export default function ResidualHistogram({ histogram, nTest }) {
  if (!histogram) return null
  const { bin_edges_usd: edges, counts } = histogram
  const maxCount = Math.max(...counts)
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const barGap = 2
  const barW = plotW / counts.length - barGap
  const zeroX = PAD_L + ((0 - edges[0]) / (edges[edges.length - 1] - edges[0])) * plotW

  return (
    <section className="hv-card residual-histogram">
      <p className="hv-label">Prediction Error Distribution</p>
      <p className="residual-histogram__note">
        Predicted minus actual, across all {nTest?.toLocaleString() ?? counts.reduce((a, b) => a + b, 0).toLocaleString()}{' '}
        held-out test properties. Centered near $0 and roughly symmetric means the model isn't
        systematically over- or under-pricing.
      </p>
      <svg
        className="residual-histogram__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Histogram of prediction errors (predicted minus actual) on the held-out test set."
      >
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} className="residual-histogram__axis" />
        <line x1={zeroX} y1={PAD_T} x2={zeroX} y2={H - PAD_B} className="residual-histogram__zero" />
        {counts.map((c, i) => {
          const barH = (c / maxCount) * plotH
          const x = PAD_L + i * (barW + barGap)
          const y = H - PAD_B - barH
          const binCenter = (edges[i] + edges[i + 1]) / 2
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(barW, 1)}
              height={Math.max(barH, 1)}
              rx="3"
              className={`residual-histogram__bar ${binCenter >= 0 ? 'is-over' : 'is-under'}`}
            >
              <title>{`${fmtUsd(edges[i])} to ${fmtUsd(edges[i + 1])}: ${c.toLocaleString()} properties`}</title>
            </rect>
          )
        })}
        {[edges[0], 0, edges[edges.length - 1]].map((t, i) => (
          <text
            key={i}
            x={PAD_L + ((t - edges[0]) / (edges[edges.length - 1] - edges[0])) * plotW}
            y={H - 8}
            className="residual-histogram__tick"
          >
            {fmtUsd(t)}
          </text>
        ))}
      </svg>
    </section>
  )
}
