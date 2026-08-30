import './DistributionChart.css'

const W = 640
const H = 220
const PAD_L = 44
const PAD_B = 28
const PAD_T = 12
const PAD_R = 8

export default function DistributionChart({ stats }) {
  const { bin_edges_usd: edges, counts } = stats.target.histogram
  const maxCount = Math.max(...counts)
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const barGap = 2
  const barW = plotW / counts.length - barGap

  const fmtUsd = (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`)
  const tickIdx = [0, Math.floor(counts.length / 2), counts.length]

  return (
    <section className="hv-card distribution-chart">
      <p className="hv-label">Median House Value — Distribution</p>
      <svg
        className="distribution-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Histogram of ${stats.n_records.toLocaleString()} median house values, from ${fmtUsd(stats.target.min_usd)} to ${fmtUsd(stats.target.max_usd)}`}
      >
        <line
          x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B}
          className="distribution-chart__axis"
        />
        {counts.map((c, i) => {
          const barH = (c / maxCount) * plotH
          const x = PAD_L + i * (barW + barGap)
          const y = H - PAD_B - barH
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(barW, 1)}
              height={Math.max(barH, 1)}
              rx="3"
              className="distribution-chart__bar"
            >
              <title>{`${fmtUsd(edges[i])}–${fmtUsd(edges[i + 1])}: ${c.toLocaleString()} records`}</title>
            </rect>
          )
        })}
        {tickIdx.map((i) => {
          const x = PAD_L + i * (plotW / counts.length)
          return (
            <text key={i} x={Math.min(x, W - PAD_R)} y={H - 8} className="distribution-chart__tick">
              {fmtUsd(edges[i] ?? edges[edges.length - 1])}
            </text>
          )
        })}
      </svg>
      <p className="distribution-chart__caption">
        {stats.n_records.toLocaleString()} records · capped at ${stats.target.capped_at_usd.toLocaleString()} in
        the source dataset
      </p>
    </section>
  )
}
