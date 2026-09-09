import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/authContext'
import { useSetView } from './lib/nav'

import RequireAuth from './components/routing/RequireAuth'
import GuestOnly from './components/routing/GuestOnly'
import AppShell from './components/routing/AppShell'
import NotFound from './components/routing/NotFound'

import Home from './components/marketing/Home'
import About from './components/marketing/About'
import Features from './components/marketing/Features'
import PrivacyPolicy from './components/marketing/PrivacyPolicy'
import Terms from './components/marketing/Terms'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'

import Dashboard from './components/Dashboard'
import ValuationFlow from './components/valuation/ValuationFlow'
import WhatIfPage from './components/valuation/WhatIfPage'
import Analysis from './components/analysis/Analysis'
import ComparableProperties from './components/comparables/ComparableProperties'
import InvestmentCalculator from './components/investment/InvestmentCalculator'
import PropertyComparison from './components/compare/PropertyComparison'
import History from './components/history/History'
import ModelHub from './components/model/ModelHub'
import Properties from './components/properties/Properties'
import Profile from './components/account/Profile'
import Settings from './components/account/Settings'

// Every existing page component below already accepts a `setView(key)`
// prop (from the pre-router version of this app, where navigation was
// local view-state). These one-line wrappers are the only thing that
// changed when the app moved to real URL routes: each supplies that same
// prop via useSetView(), which just calls react-router's navigate() under
// the VIEW_PATHS translation table (see lib/nav.js) -- the page components
// themselves needed zero changes.
function DashboardRoute() {
  return <Dashboard setView={useSetView()} />
}
function PredictRoute() {
  return <ValuationFlow setView={useSetView()} />
}
function PropertiesRoute() {
  return <Properties setView={useSetView()} />
}
function ComparablesRoute() {
  return <ComparableProperties setView={useSetView()} />
}
function WhatIfRoute() {
  return <WhatIfPage setView={useSetView()} />
}
function HistoryRoute() {
  return <History setView={useSetView()} />
}
function CompareRoute() {
  return <PropertyComparison setView={useSetView()} />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestOnly><Home /></GuestOnly>} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
          <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />

          {/* Predict stays outside RequireAuth on purpose: a visitor should be
              able to see what the model actually does -- run a prediction and
              read the explanation -- before being asked to create an account.
              Saving, comparing, and everything else still requires signing in. */}
          <Route element={<AppShell />}>
            <Route path="/predict" element={<PredictRoute />} />
          </Route>

          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/properties" element={<PropertiesRoute />} />
            <Route path="/market-analytics" element={<Analysis />} />
            <Route path="/comparables" element={<ComparablesRoute />} />
            <Route path="/what-if" element={<WhatIfRoute />} />
            <Route path="/investment" element={<InvestmentCalculator />} />
            <Route path="/model-insights" element={<ModelHub />} />
            <Route path="/history" element={<HistoryRoute />} />
            <Route path="/compare" element={<CompareRoute />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
