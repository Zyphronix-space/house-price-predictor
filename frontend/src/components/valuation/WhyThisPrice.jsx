import './WhyThisPrice.css'

const fmtUsd = (v) => `${v >= 0 ? '+' : '-'}$${Math.abs(Math.round(v)).toLocaleString()}`

function ContributorBar({ item, maxAbs }) {
  const width = maxAbs > 0 ? (Math.abs(item.shap_usd) / maxAbs) * 100 : 0
  return (
    <li className={`why-price__row why-price__row--${item.direction}`}>
      <span className="why-price__row-label">{item.label}</span>
      <span className="why-price__row-track">
        <span className="why-price__row-fill" style={{ width: `${width}%` }} />
      </span>
      <span className="why-price__row-value">{fmtUsd(item.shap_usd)}</span>
    </li>
  )
}

export default function WhyThisPrice({ explanation }) {
  if (!explanation) return null

  const { top_positive: positives, top_negative: negatives, contributions } = explanation
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.shap_usd)), 1)

  return (
    <section className="hv-card why-price">
      <p className="hv-label">Why this price?</p>
      <p className="why-price__note">
        Computed with SHAP (TreeExplainer) directly from the served Random Forest model for
        this specific input. Each bar is that feature's real dollar contribution above or
        below the model's baseline expected value — it explains this model's reasoning, not
        a causal claim about what actually drives real-world prices.
      </p>

      <div className="why-price__columns">
        <div>
          <p className="why-price__col-title why-price__col-title--positive">Pushed price up</p>
          <ul className="why-price__list">
            {positives.length === 0 && <li className="why-price__empty">No positive factors.</li>}
            {positives.map((item) => (
              <ContributorBar key={item.feature} item={item} maxAbs={maxAbs} />
            ))}
          </ul>
        </div>
        <div>
          <p className="why-price__col-title why-price__col-title--negative">Pushed price down</p>
          <ul className="why-price__list">
            {negatives.length === 0 && <li className="why-price__empty">No negative factors.</li>}
            {negatives.map((item) => (
              <ContributorBar key={item.feature} item={item} maxAbs={maxAbs} />
            ))}
          </ul>
        </div>
      </div>

      <p className="why-price__base">
        Model baseline (average prediction over the training data): $
        {Math.round(explanation.base_value_usd).toLocaleString()}
      </p>
    </section>
  )
}
