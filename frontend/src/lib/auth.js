// Session handling for the FastAPI backend's JWT-based auth (see
// backend/auth.py). The token itself is the only thing kept in browser
// storage -- it's an opaque, expiring session credential, not user data,
// so it doesn't belong alongside anything fetched from the backend.
//
// "Remember me" controls WHERE the token lives: localStorage survives
// closing the browser, sessionStorage clears when the tab/browser closes.
// getToken() checks both so a session started either way keeps working.

import { API_URL } from './apiUrl'

const TOKEN_KEY = 'hv:token'

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token, rememberMe = true) {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(TOKEN_KEY)
    if (token) {
      ;(rememberMe ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token)
    }
  } catch {
    // ignore -- storage unavailable
  }
}

export function authHeaders(extra = {}) {
  const token = getToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

async function parseErrorOrThrow(res, fallback) {
  const data = await res.json().catch(() => ({}))
  throw new Error(data.detail || fallback)
}

export async function signup(email, password, displayName) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName || undefined }),
  })
  if (!res.ok) await parseErrorOrThrow(res, 'Could not create an account')
  return res.json()
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) await parseErrorOrThrow(res, 'Could not sign in')
  return res.json()
}

export async function fetchCurrentUser() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) await parseErrorOrThrow(res, "Couldn't process that request")
  return res.json()
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })
  if (!res.ok) await parseErrorOrThrow(res, "Couldn't reset your password")
}

export function logout() {
  setToken(null)
}
