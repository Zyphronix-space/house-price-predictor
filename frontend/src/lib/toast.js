// Minimal toast pub-sub -- no context provider needed, any component can
// call showToast() directly and ToastHost (mounted once in Layout) renders
// whatever is currently queued.

let toasts = []
const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener(toasts))
}

export function showToast(message, type = 'info', durationMs = 4000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => dismissToast(id), durationMs)
  return id
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function subscribeToasts(listener) {
  listeners.add(listener)
  listener(toasts)
  return () => listeners.delete(listener)
}
