// Central auth state -- who's signed in, and the signup/login/logout
// actions that change it. Previously local state in App.jsx; pulled out so
// route guards (RequireAuth/GuestOnly) and pages like Profile/Settings can
// all read the same session without prop-drilling through the router.
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCurrentUser, getToken, logout as clearSession, setToken } from './auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
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

  const signIn = (data, rememberMe = true) => {
    setToken(data.access_token, rememberMe)
    setUser(data.user)
  }

  const signOut = () => {
    clearSession()
    setUser(null)
  }

  const refreshUser = async () => {
    const data = await fetchCurrentUser()
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, authChecked, signIn, signOut, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
