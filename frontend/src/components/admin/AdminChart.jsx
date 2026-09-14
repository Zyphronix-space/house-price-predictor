import '../dashboard/DashboardCharts.css'

// Same visual language as dashboard/ActivityChart, but takes already
// server-bucketed { date, count } rows (see routes_admin.py) instead of a
// raw list to bucket client-side -- the admin stats endpoint aggregates
// across every user, which isn't data client code should ever hold
// unbucketed.
const W = 560
const H = 160
const PAD_L = 8
const PAD_B = 22
const PAD_T = 10
const PAD_R = 8

export default function AdminChart({ label, days }) {
  const maxCount = Math.max(1, ...days.map((d) => d.count))
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const barGap = 4
  const barW = plotW / days.length - barGap

  const tickIdx = [0, Math.floor(days.length / 2), days.length - 1]
  const fmtDay = (key) => new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <section className="hv-card dashboard-chart">
      <p className="hv-label">{label}</p>
      <svg
        className="dashboard-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}, peaking at ${maxCount}`}
      >
        {days.map((d, i) => {
          const barH = (d.count / maxCount) * plotH
          const x = PAD_L + i * (barW + barGap)
          const y = H - PAD_B - barH
          return (
            <rect
              key={d.date}
              x={x}
              y={Math.max(y, PAD_T)}
              width={Math.max(barW, 1)}
              height={Math.max(barH, 2)}
              rx="3"
              className="dashboard-chart__bar"
            >
              <title>{`${fmtDay(d.date)}: ${d.count}`}</title>
            </rect>
          )
        })}
        {tickIdx.map((i) => {
          const x = PAD_L + i * (plotW / days.length) + barW / 2
          return (
            <text key={i} x={x} y={H - 6} className="dashboard-chart__tick">
              {fmtDay(days[i].date)}
            </text>
          )
        })}
      </svg>
    </section>
  )
}
