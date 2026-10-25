import { FIELD_META } from '../../lib/fields'
import { formatSignedUsd, formatUsd } from '../../lib/format'
import './WhyThisPrice.css'

// All eight tree-path contributions as one diverging bar chart around
// zero, largest effect first. baseline + sum(contributions) reconstructs
// the estimate exactly, so the chart ends with that reconciliation.
export default function WhyThisPrice({ explanation }) {
  if (!explanation) return null

  const rows = [...explanation.contributions].sort((a, b) => Math.abs(b.shap_usd) - Math.abs(a.shap_usd))
  const maxAbs = Math.max(...rows.map((c) => Math.abs(c.shap_usd)), 1)
  const total = explanation.base_value_usd + rows.reduce((sum, c) => sum + c.shap_usd, 0)

  return (
    <section className="why-price" aria-labelledby="why-price-title">
      <h2 id="why-price-title" className="why-price__title">What moved the estimate</h2>
      <p className="why-price__note">
        How far each input moved this estimate above or below the model's baseline, traced through
        the Random Forest's decision trees for these exact inputs. It describes the model's
        reasoning, not what causes real prices.
      </p>

      <ul className="why-price__list">
        {rows.map((item) => {
          const pct = (Math.abs(item.shap_usd) / maxAbs) * 50
          const positive = item.shap_usd >= 0
          return (
            <li key={item.feature} className={`why-price__row ${positive ? 'is-positive' : 'is-negative'}`}>
              <span className="why-price__row-label">{FIELD_META[item.feature]?.label ?? item.label}</span>
              <span className="why-price__row-track" aria-hidden="true">
                <span className="why-price__row-zero" />
                <span
                  className="why-price__row-fill"
                  style={positive ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }}
                />
              </span>
              <span className="why-price__row-value hv-tabular">{formatSignedUsd(item.shap_usd)}</span>
            </li>
          )
        })}
      </ul>

      <dl className="why-price__sum">
        <div>
          <dt>Model baseline (average over training data)</dt>
          <dd className="hv-tabular">{formatUsd(explanation.base_value_usd)}</dd>
        </div>
        <div>
          <dt>Sum of input effects</dt>
          <dd className="hv-tabular">{formatSignedUsd(total - explanation.base_value_usd)}</dd>
        </div>
        <div className="why-price__sum-total">
          <dt>Estimate</dt>
          <dd className="hv-tabular">{formatUsd(total)}</dd>
        </div>
      </dl>
    </section>
  )
}
