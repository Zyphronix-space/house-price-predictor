import './CorrelationHeatmap.css'

// Real Pearson correlation matrix (dataset_stats.feature_correlation),
// computed once in ml/compare_models.py from the full dataset.
function cellColor(v) {
  // v in [-1, 1]. Positive -> accent, negative -> critical, both scaled by
  // |v| via CSS custom property so the design tokens stay the source of
  // color truth (no new palette introduced).
  const alpha = Math.min(1, Math.abs(v)) * 0.85
  const varName = v >= 0 ? '--hv-positive' : '--hv-negative'
  return `color-mix(in srgb, var(${varName}) ${Math.round(alpha * 100)}%, var(--hv-bg-elevated))`
}

export default function CorrelationHeatmap({ correlation }) {
  if (!correlation) return null
  const { labels, matrix } = correlation

  return (
    <div className="hv-card correlation-heatmap">
      <p className="hv-label">Feature Correlation</p>
      <p className="correlation-heatmap__note">
        Pearson correlation across the 8 model inputs and the target (MedHouseVal), computed
        on the full dataset. Correlation, not causation.
      </p>
      <div className="correlation-heatmap__scroll">
        <table className="correlation-heatmap__table">
          <thead>
            <tr>
              <th></th>
              {labels.map((l) => (
                <th key={l} scope="col">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={labels[i]}>
                <th scope="row">{labels[i]}</th>
                {row.map((v, j) => (
                  <td key={j} style={{ background: cellColor(v) }} title={`${labels[i]} vs ${labels[j]}: ${v.toFixed(2)}`}>
                    {v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
