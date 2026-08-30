import { useState } from 'react'
import Layout from './components/Layout'
import Home from './components/Home'
import ValuationFlow from './components/valuation/ValuationFlow'
import PropertyComparison from './components/compare/PropertyComparison'
import History from './components/history/History'
import ModelHub from './components/model/ModelHub'

function App() {
  const [view, setView] = useState('home')

  return (
    <Layout view={view} setView={setView}>
      {view === 'home' && <Home setView={setView} />}
      {view === 'valuate' && <ValuationFlow setView={setView} />}
      {view === 'compare' && <PropertyComparison setView={setView} />}
      {view === 'history' && <History setView={setView} />}
      {view === 'model' && <ModelHub />}
    </Layout>
  )
}

export default App
