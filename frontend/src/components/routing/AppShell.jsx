import { Outlet } from 'react-router-dom'
import Layout from '../Layout'
import CommandPalette from '../CommandPalette'
import { useAuth } from '../../lib/authContext'
import { useCurrentView, useSetView } from '../../lib/nav'

// The app frame for guests and signed-in users alike: nav (Layout), the
// current page (Outlet, matched by the nested <Route>s in App.jsx), and,
// for signed-in users only, the command palette (its commands include
// account pages and logout).
export default function AppShell() {
  const { user, signOut } = useAuth()
  const view = useCurrentView()
  const setView = useSetView()

  return (
    <Layout view={view} setView={setView} user={user} onLogout={signOut}>
      <Outlet />
      {user && <CommandPalette setView={setView} onLogout={signOut} />}
    </Layout>
  )
}
