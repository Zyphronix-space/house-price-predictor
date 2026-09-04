import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import AuthPage from './components/AuthPage'
import ValuationFlow from './components/valuation/ValuationFlow'
import WhatIfPage from './components/valuation/WhatIfPage'
import Analysis from './components/analysis/Analysis'
import ComparableProperties from './components/comparables/ComparableProperties'
import InvestmentCalculator from './components/investment/InvestmentCalculator'
import PropertyComparison from './components/compare/PropertyComparison'
import History from './components/history/History'
import ModelHub from './components/model/ModelHub'
import Properties from './components/properties/Properties'
import { fetchCurrentUser, getToken, logout, setToken } from './lib/auth'

function App() {
  const [view, setView] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setAuthChecked(true)
      return
    }
    fetchCurrentUser().then((data) => {
      setUser(data)
      setAuthChecked(true)
    })
  }, [])

  if (!authChecked) return null

  if (!user) {
    return (
      <AuthPage
        onAuthenticated={(data) => {
          setToken(data.access_token)
          setUser(data.user)
        }}
      />
    )
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setView('dashboard')
  }

  return (
    <Layout view={view} setView={setView} user={user} onLogout={handleLogout}>
      {view === 'dashboard' && <Dashboard setView={setView} />}
      {view === 'predict' && <ValuationFlow setView={setView} />}
      {view === 'properties' && <Properties setView={setView} />}
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
