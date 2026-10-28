import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/authContext'
import { useSetView } from './lib/nav'

import RequireAuth from './components/routing/RequireAuth'
import RequireAdmin from './components/routing/RequireAdmin'
import AccountGate from './components/routing/AccountGate'
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
import AdminShell from './components/admin/AdminShell'
import AdminOverview from './components/admin/AdminOverview'
import AdminUsersPage from './components/admin/AdminUsersPage'
import AdminPropertiesPage from './components/admin/AdminPropertiesPage'
import AdminPredictionsPage from './components/admin/AdminPredictionsPage'

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

          {/* The core experience is public: estimating an area, comparing
              areas (kept in this browser), the what-if simulator and how the
              model works all run on API routes that don't need a token.
              Pages that read or write a user's saved data sit behind
              AccountGate, which explains the benefit in place instead of
              redirecting; the API refuses those calls without a token anyway. */}
          <Route element={<AppShell />}>
            <Route path="/predict" element={<PredictRoute />} />
            <Route path="/compare" element={<CompareRoute />} />
            <Route path="/what-if" element={<WhatIfRoute />} />
            <Route path="/model-insights" element={<ModelHub />} />

            <Route
              path="/dashboard"
              element={
                <AccountGate
                  title="Your dashboard lives in your account"
                  benefit="It brings together the estimates you've saved and the properties you're keeping track of, so you can pick up where you left off on any device."
                >
                  <DashboardRoute />
                </AccountGate>
              }
            />
            <Route
              path="/properties"
              element={
                <AccountGate
                  title="Keep a list of properties"
                  benefit="With a free account you can save the places you're interested in and link your estimates to them. The list is stored in your account, so it's there whenever you sign in."
                >
                  <PropertiesRoute />
                </AccountGate>
              }
            />
            <Route
              path="/history"
              element={
                <AccountGate
                  title="Keep a history of your estimates"
                  benefit="Estimates you save are stored in your account. You can come back to them from any device, compare them, and export them as CSV or JSON."
                >
                  <HistoryRoute />
                </AccountGate>
              }
            />
            <Route
              path="/comparables"
              element={
                <AccountGate
                  title="Find similar neighbourhoods"
                  benefit="Looking up the real 1990 neighbourhoods most like your estimate is available with a free account. It starts from the estimates saved in your history."
                >
                  <ComparablesRoute />
                </AccountGate>
              }
            />
            <Route
              path="/market-analytics"
              element={
                <AccountGate
                  title="Explore the full dataset"
                  benefit="The detailed dataset charts (samples of the 1990 census records and how the model scored on them) are available with a free account."
                >
                  <Analysis />
                </AccountGate>
              }
            />
            <Route
              path="/investment"
              element={
                <AccountGate
                  title="Investment calculator"
                  benefit="The calculator starts from the estimates saved in your account. Remember that HomeValue's estimates are 1990 neighbourhood values, not today's prices."
                >
                  <InvestmentCalculator />
                </AccountGate>
              }
            />
          </Route>

          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* The admin panel is deliberately NOT nested under <AppShell> --
              it owns the whole viewport with its own sidebar/shell
              (AdminShell) instead of sitting inside the customer-facing
              nav + footer. RequireAuth still gates it first (so an
              anonymous visitor is sent to /login, not straight to a 403
              feel), then RequireAdmin. */}
          <Route element={<RequireAuth><RequireAdmin><AdminShell /></RequireAdmin></RequireAuth>}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/properties" element={<AdminPropertiesPage />} />
            <Route path="/admin/predictions" element={<AdminPredictionsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
