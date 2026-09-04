import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ValuationFlow from './components/valuation/ValuationFlow'
import WhatIfPage from './components/valuation/WhatIfPage'
import Analysis from './components/analysis/Analysis'
import ComparableProperties from './components/comparables/ComparableProperties'
import InvestmentCalculator from './components/investment/InvestmentCalculator'
import PropertyComparison from './components/compare/PropertyComparison'
import History from './components/history/History'
import ModelHub from './components/model/ModelHub'

function App() {
  const [view, setView] = useState('dashboard')

  return (
    <Layout view={view} setView={setView}>
      {view === 'dashboard' && <Dashboard setView={setView} />}
      {view === 'predict' && <ValuationFlow setView={setView} />}
      {view === 'analysis' && <Analysis />}
      {view === 'comparables' && <ComparableProperties setView={setView} />}
      {view === 'whatif' && <WhatIfPage setView={setView} />}
      {view === 'investment' && <InvestmentCalculator />}
      {view === 'model' && <ModelHub />}
      {view === 'history' && <History setView={setView} />}
      {view === 'compare' && <PropertyComparison setView={setView} />}
    </Layout>
  )
}

export default App
