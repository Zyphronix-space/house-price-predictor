import { Outlet } from 'react-router-dom'
import Layout from '../Layout'
import CommandPalette from '../CommandPalette'
import { useAuth } from '../../lib/authContext'
import { useCurrentView, useSetView } from '../../lib/nav'

// The authenticated app frame: nav + ambient background (Layout), the
// current page (Outlet, matched by the nested <Route>s in App.jsx), and
// the two global overlays (command palette, notification center) that any
// authenticated page should be able to trigger.
export default function AppShell() {
  const { user, signOut } = useAuth()
  const view = useCurrentView()
  const setView = useSetView()

  return (
    <Layout view={view} setView={setView} user={user} onLogout={signOut}>
      <Outlet />
      <CommandPalette setView={setView} onLogout={signOut} />
    </Layout>
  )
}
