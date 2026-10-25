import { formatUsd, formatUsdCompact } from '../../lib/format'
import './DashboardCharts.css'

const W = 640
const H = 200
const PAD = { top: 18, right: 12, bottom: 30, left: 44 }

function niceTicks(max, count = 3) {
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  return Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step)
}

// The real distribution of median house values across every block group
// in the training dataset (/dataset-stats), with the given estimates
// marked on it. Answers "is this estimate typical or unusual for the
// data the model learned from?" without inventing anything.
export default function DatasetPositionChart({ histogram, markers = [], cappedAt, caption }) {
  const edges = histogram.bin_edges_usd
  const counts = histogram.counts
  const xMin = edges[0]
  const xMax = edges[edges.length - 1]
  const yMax = Math.max(...counts)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (v) => PAD.left + ((Math.min(Math.max(v, xMin), xMax) - xMin) / (xMax - xMin)) * plotW
  const y = (c) => PAD.top + plotH - (c / yMax) * plotH
  const yTicks = niceTicks(yMax)
  const xTicks = [100_000, 200_000, 300_000, 400_000, 500_000].filter((t) => t >= xMin && t <= xMax)

  return (
    <figure className="dataset-chart">
      <svg
        className="dataset-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Distribution of median house values across the training dataset, from ${formatUsd(xMin)} to ${formatUsd(xMax)}${
          markers.length ? `, with ${markers.length} estimate${markers.length === 1 ? '' : 's'} marked` : ''
        }`}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="dataset-chart__grid" />
            <text x={PAD.left - 8} y={y(t)} className="dataset-chart__tick dataset-chart__tick--y">
              {t.toLocaleString()}
            </text>
          </g>
        ))}

        {counts.map((c, i) => {
          const x0 = x(edges[i])
          const x1 = x(edges[i + 1])
          return (
            <rect key={i} x={x0 + 1} y={y(c)} width={Math.max(x1 - x0 - 2, 1)} height={PAD.top + plotH - y(c)} className="dataset-chart__bar">
              <title>{`${formatUsd(edges[i])} – ${formatUsd(edges[i + 1])}: ${c.toLocaleString()} block groups`}</title>
            </rect>
          )
        })}

        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="dataset-chart__axis" />
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 10} className="dataset-chart__tick">
            {formatUsdCompact(t)}
          </text>
        ))}

        {markers.map((m, i) => (
          <g key={`${m.value}-${i}`} className={m.emphasis ? 'dataset-chart__marker is-emphasis' : 'dataset-chart__marker'}>
            <line x1={x(m.value)} x2={x(m.value)} y1={PAD.top - 6} y2={PAD.top + plotH} />
            {m.emphasis && (
              <text
                x={x(m.value)}
                y={PAD.top - 8}
                textAnchor={x(m.value) > W - 70 ? 'end' : x(m.value) < PAD.left + 50 ? 'start' : 'middle'}
                className="dataset-chart__marker-label"
              >
                {m.label ?? formatUsdCompact(m.value)}
              </text>
            )}
            <title>{`${m.label ?? 'Estimate'}: ${formatUsd(m.value)}`}</title>
          </g>
        ))}
      </svg>
      <figcaption className="dataset-chart__caption">
        {caption}
        {cappedAt ? ` Values in the source data are capped at ${formatUsd(cappedAt)}, so the last bar collects everything above it.` : ''}
      </figcaption>
    </figure>
  )
}
