import './ScatterChart.css'

const W = 480
const H = 300
const PAD_L = 60
const PAD_B = 36
const PAD_T = 16
const PAD_R = 12

// Generic x/y scatter over real data points -- no library, same
// hand-rolled-SVG approach as ModelCheck/DistributionChart.
export default function ScatterChart({ title, points, xLabel, yLabel, xFormat = (v) => v, yFormat = (v) => v }) {
  if (points.length === 0) return null

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)

  const scaleX = (v) => PAD_L + ((v - xMin) / (xMax - xMin || 1)) * (W - PAD_L - PAD_R)
  const scaleY = (v) => H - PAD_B - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD_T - PAD_B)

  const xTicks = [xMin, xMin + (xMax - xMin) / 2, xMax]
  const yTicks = [yMin, yMin + (yMax - yMin) / 2, yMax]

  return (
    <div className="hv-card scatter-chart">
      <p className="hv-label">{title}</p>
      <svg
        className="scatter-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Scatter plot of ${yLabel} versus ${xLabel} across ${points.length} real properties.`}
      >
        <line x1={PAD_L} y1={H - PAD_B} x2={PAD_L} y2={PAD_T} className="scatter-chart__axis" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} className="scatter-chart__axis" />
        {points.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r="2.5" className="scatter-chart__dot" />
        ))}
        {xTicks.map((t, i) => (
          <text key={`x${i}`} x={scaleX(t)} y={H - PAD_B + 18} className="scatter-chart__tick" textAnchor="middle">
            {xFormat(t)}
          </text>
        ))}
        {yTicks.map((t, i) => (
          <text key={`y${i}`} x={PAD_L - 8} y={scaleY(t) + 4} className="scatter-chart__tick" textAnchor="end">
            {yFormat(t)}
          </text>
        ))}
        <text x={(W + PAD_L - PAD_R) / 2} y={H - 2} className="scatter-chart__axis-label" textAnchor="middle">
          {xLabel}
        </text>
      </svg>
      <p className="scatter-chart__caption">{points.length.toLocaleString()} real records (sampled)</p>
    </div>
  )
}
