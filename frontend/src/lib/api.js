import { API_URL } from './apiUrl'
import { authHeaders, setToken } from './auth'

class ApiError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'ApiError'
    this.cause = cause
  }
}

async function request(path, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...options.headers },
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The model engine took too long to respond.', err)
    }
    throw new ApiError("We couldn't reach the model engine.", err)
  } finally {
    clearTimeout(timeout)
  }

  if (res.status === 401) {
    // Session expired or invalid -- clear it so the app falls back to the
    // sign-in screen instead of looping on 401s.
    setToken(null)
  }

  if (!res.ok) {
    // FastAPI error bodies are {"detail": "..."} -- surface that when present,
    // it's usually more useful than a bare status code.
    let detail = null
    try {
      detail = (await res.json())?.detail
    } catch {
      // body wasn't JSON -- fall through to the generic message
    }
    throw new ApiError(typeof detail === 'string' ? detail : `The model engine responded with an error (${res.status}).`)
  }

  if (res.status === 204) return null

  try {
    return await res.json()
  } catch (err) {
    throw new ApiError('The model engine sent back an unexpected response.', err)
  }
}

const jsonBody = (body) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// These are static for the lifetime of the served model, so cache the
// in-flight/resolved promise -- every caller shares one network request
// instead of each page re-fetching the same JSON.
const memo = new Map()
function cached(key, path) {
  return () => {
    if (!memo.has(key)) {
      memo.set(
        key,
        request(path).catch((err) => {
          memo.delete(key) // let a failed fetch be retried later
          throw err
        })
      )
    }
    return memo.get(key)
  }
}

export const api = {
  health: () => request('/health'),
  predict: (features) =>
    request('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    }),
  comparables: (features, k = 8) =>
    request(`/comparables?k=${k}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    }),
  parseDescription: (text) =>
    request(
      '/parse-description',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) },
      20000, // Gemini call with retry/backoff can take longer than the default timeout
    ),
  modelInfo: cached('model-info', '/model-info'),
  modelComparison: cached('model-comparison', '/model-comparison'),
  modelEvaluations: () => request('/model-evaluations'),
  datasetStats: cached('dataset-stats', '/dataset-stats'),
  evaluationSample: cached('evaluation-sample', '/evaluation-sample'),
  datasetSample: cached('dataset-sample', '/dataset-sample?n=600'),

  // --- Auth-backed resources (see lib/auth.js for signup/login/me) -----
  houses: {
    list: (params = {}) => request(`/houses?${new URLSearchParams(params)}`),
    get: (id) => request(`/houses/${id}`),
    create: (payload) => request('/houses', { method: 'POST', ...jsonBody(payload) }),
    update: (id, payload) => request(`/houses/${id}`, { method: 'PATCH', ...jsonBody(payload) }),
    remove: (id) => request(`/houses/${id}`, { method: 'DELETE' }),
  },
  predictions: {
    list: (params = {}) => request(`/predictions?${new URLSearchParams(params)}`),
    get: (id) => request(`/predictions/${id}`),
    create: (payload) => request('/predictions', { method: 'POST', ...jsonBody(payload) }),
    remove: (id) => request(`/predictions/${id}`, { method: 'DELETE' }),
  },
  dashboardSummary: () => request('/dashboard/summary'),

  updateProfile: (payload) => request('/auth/me', { method: 'PATCH', ...jsonBody(payload) }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', ...jsonBody(payload) }),
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),

  admin: {
    stats: () => request('/admin/stats'),
    users: () => request('/admin/users'),
    updateUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PATCH', ...jsonBody(payload) }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    restoreUser: (id) => request(`/admin/users/${id}/restore`, { method: 'POST' }),
    houses: () => request('/admin/houses'),
    updateHouse: (id, payload) => request(`/admin/houses/${id}`, { method: 'PATCH', ...jsonBody(payload) }),
    deleteHouse: (id) => request(`/admin/houses/${id}`, { method: 'DELETE' }),
    predictions: () => request('/admin/predictions'),
    deletePrediction: (id) => request(`/admin/predictions/${id}`, { method: 'DELETE' }),
  },
}

export { ApiError, API_URL }
