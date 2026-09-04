// Session handling for the FastAPI backend's JWT-based auth (see
// backend/auth.py). The token itself is the only thing kept in
// localStorage -- it's an opaque, expiring session credential, not user
// data, so it doesn't belong alongside anything fetched from the backend.

import { API_URL } from './apiUrl'

const TOKEN_KEY = 'hv:token'

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore -- localStorage unavailable
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

export async function signup(email, password) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
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

export function logout() {
  setToken(null)
}
