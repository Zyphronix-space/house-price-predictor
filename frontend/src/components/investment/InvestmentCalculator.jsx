import { useEffect, useState } from 'react'
import { computeInvestment } from '../../lib/investmentMath'
import { api } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import './InvestmentCalculator.css'

const FIELDS = [
  { key: 'purchasePrice', label: 'Purchase price', unit: '$' },
  { key: 'downPayment', label: 'Down payment', unit: '$' },
  { key: 'mortgageRatePct', label: 'Mortgage rate', unit: '% / yr' },
  { key: 'loanTermYears', label: 'Loan term', unit: 'years' },
  { key: 'monthlyRentalIncome', label: 'Monthly rental income', unit: '$' },
  { key: 'annualPropertyTax', label: 'Property tax', unit: '$ / yr' },
  { key: 'annualInsurance', label: 'Insurance', unit: '$ / yr' },
  { key: 'monthlyMaintenance', label: 'Maintenance', unit: '$ / mo' },
]

function defaultInputs(purchasePrice) {
  return {
    purchasePrice,
    downPayment: Math.round(purchasePrice * 0.2),
    mortgageRatePct: 6.5,
    loanTermYears: 30,
    monthlyRentalIncome: Math.round((purchasePrice * 0.008)),
    annualPropertyTax: Math.round(purchasePrice * 0.011),
    annualInsurance: 1400,
    monthlyMaintenance: 150,
  }
}

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`

export default function InvestmentCalculator() {
  const { data } = useAsync(() => api.predictions.list(), [])
  const [inputs, setInputs] = useState(() => defaultInputs(400000))
  const [seeded, setSeeded] = useState(false)

  // Once the user's real prediction history loads, pre-fill the purchase
  // price from their most recent prediction -- but only the first time, so
  // it never clobbers values the user has already started editing.
  useEffect(() => {
    if (seeded || !data) return
    const latest = data.predictions?.[0]
    if (latest) setInputs(defaultInputs(Math.round(latest.predicted_price_usd)))
    setSeeded(true)
  }, [data, seeded])

  const handleChange = (key, raw) => {
    const value = Number(raw)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }))
  }

  const result = computeInvestment(inputs)

  return (
    <section className="investment">
      <p className="hv-label">Investment Calculator</p>
      <p className="investment__note">
        Arithmetic over the assumptions you enter below (standard mortgage amortization and
        cash-flow formulas), not financial advice, and not connected to the ML model beyond
        pre-filling the purchase price from your last prediction.
      </p>

      <div className="hv-card investment__grid">
        {FIELDS.map((f) => (
          <label key={f.key} className="investment__field">
            <span className="investment__field-label">{f.label}</span>
            <div className="investment__field-control">
              <input
                type="number"
                className="hv-input"
                value={inputs[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
              <span className="investment__field-unit">{f.unit}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="investment__results">
        <div className="hv-card investment__stat">
          <p className="hv-label">Monthly mortgage</p>
          <p className="investment__stat-value">{fmtUsd(result.monthlyMortgage)}</p>
        </div>
        <div className="hv-card investment__stat">
          <p className="hv-label">Monthly cash flow</p>
          <p className={`investment__stat-value ${result.monthlyCashFlow >= 0 ? 'is-positive' : 'is-negative'}`}>
            {fmtUsd(result.monthlyCashFlow)}
          </p>
        </div>
        <div className="hv-card investment__stat">
          <p className="hv-label">Annual cash flow</p>
          <p className={`investment__stat-value ${result.annualCashFlow >= 0 ? 'is-positive' : 'is-negative'}`}>
            {fmtUsd(result.annualCashFlow)}
          </p>
        </div>
        <div className="hv-card investment__stat">
          <p className="hv-label">Rental yield</p>
          <p className="investment__stat-value">{result.rentalYieldPct.toFixed(2)}%</p>
        </div>
        <div className="hv-card investment__stat">
          <p className="hv-label">Cash-on-cash ROI</p>
          <p className={`investment__stat-value ${result.roiPct >= 0 ? 'is-positive' : 'is-negative'}`}>
            {result.roiPct.toFixed(2)}%
          </p>
        </div>
        <div className="hv-card investment__stat">
          <p className="hv-label">Break-even estimate</p>
          <p className="investment__stat-value">
            {result.breakEvenYears ? `${result.breakEvenYears.toFixed(1)} yrs` : 'Not reached'}
          </p>
        </div>
      </div>

      <p className="investment__disclaimer">
        Educational estimate only, not financial advice. Assumes a fixed-rate mortgage, no
        vacancy, and doesn't account for closing costs, taxes on rental income, appreciation,
        or repairs beyond the maintenance figure you entered.
      </p>
    </section>
  )
}
