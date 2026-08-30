const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'ApiError'
    this.cause = cause
  }
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The model engine took too long to respond.', err)
    }
    throw new ApiError("We couldn't reach the model engine.", err)
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    throw new ApiError(`The model engine responded with an error (${res.status}).`)
  }

  try {
    return await res.json()
  } catch (err) {
    throw new ApiError('The model engine sent back an unexpected response.', err)
  }
}

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
  modelInfo: cached('model-info', '/model-info'),
  modelComparison: cached('model-comparison', '/model-comparison'),
  datasetStats: cached('dataset-stats', '/dataset-stats'),
  evaluationSample: cached('evaluation-sample', '/evaluation-sample'),
}

export { ApiError, API_URL }
