import { histogram } from '../../lib/dashboardCharts'
import './DashboardCharts.css'

const W = 560
const H = 160
const PAD_L = 8
const PAD_B = 22
const PAD_T = 10
const PAD_R = 8

const fmtUsd = (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`)

export default function PredictionDistributionChart({ predictions }) {
  const values = predictions.map((p) => p.predicted_price_usd)
  const { edges, counts } = histogram(values, Math.min(6, values.length))
  const maxCount = Math.max(1, ...counts)
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const barGap = 3
  const barW = counts.length ? plotW / counts.length - barGap : 0

  return (
    <section className="hv-card dashboard-chart">
      <p className="hv-label">Your prediction value distribution</p>
      <svg
        className="dashboard-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Distribution of your ${values.length} predicted values, from ${fmtUsd(edges[0])} to ${fmtUsd(edges[edges.length - 1])}`}
      >
        {counts.map((c, i) => {
          const barH = (c / maxCount) * plotH
          const x = PAD_L + i * (barW + barGap)
          const y = H - PAD_B - barH
          return (
            <rect
              key={i}
              x={x}
              y={Math.max(y, PAD_T)}
              width={Math.max(barW, 1)}
              height={Math.max(barH, 2)}
              rx="3"
              className="dashboard-chart__bar dashboard-chart__bar--accent2"
            >
              <title>{`${fmtUsd(edges[i])}–${fmtUsd(edges[i + 1])}: ${c} prediction${c === 1 ? '' : 's'}`}</title>
            </rect>
          )
        })}
        <text x={PAD_L} y={H - 6} className="dashboard-chart__tick">
          {fmtUsd(edges[0])}
        </text>
        <text x={W - PAD_R} y={H - 6} className="dashboard-chart__tick" textAnchor="end">
          {fmtUsd(edges[edges.length - 1])}
        </text>
      </svg>
    </section>
  )
}
