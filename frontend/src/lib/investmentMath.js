// Pure arithmetic over user-entered assumptions -- no model, no backend.
// Standard amortization/cash-flow formulas, not investment advice.

export function monthlyMortgagePayment(loanPrincipal, annualRatePct, termYears) {
  const r = annualRatePct / 100 / 12
  const n = termYears * 12
  if (n <= 0) return 0
  if (r === 0) return loanPrincipal / n
  const factor = Math.pow(1 + r, n)
  return (loanPrincipal * r * factor) / (factor - 1)
}

export function computeInvestment({
  purchasePrice,
  downPayment,
  mortgageRatePct,
  loanTermYears,
  monthlyRentalIncome,
  annualPropertyTax,
  annualInsurance,
  monthlyMaintenance,
}) {
  const loanPrincipal = Math.max(0, purchasePrice - downPayment)
  const monthlyMortgage = monthlyMortgagePayment(loanPrincipal, mortgageRatePct, loanTermYears)
  const monthlyTax = annualPropertyTax / 12
  const monthlyInsurance = annualInsurance / 12

  const monthlyCashFlow =
    monthlyRentalIncome - monthlyMortgage - monthlyTax - monthlyInsurance - monthlyMaintenance
  const annualCashFlow = monthlyCashFlow * 12

  const rentalYieldPct = purchasePrice > 0 ? ((monthlyRentalIncome * 12) / purchasePrice) * 100 : 0
  const roiPct = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0
  const breakEvenYears = annualCashFlow > 0 ? downPayment / annualCashFlow : null

  return {
    loanPrincipal,
    monthlyMortgage,
    monthlyCashFlow,
    annualCashFlow,
    rentalYieldPct,
    roiPct,
    breakEvenYears,
  }
}
