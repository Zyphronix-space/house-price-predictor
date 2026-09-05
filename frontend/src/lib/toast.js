// Toast pub-sub, plus a persisted notification feed built from the exact
// same real events (no invented notifications) -- any component can call
// showToast() and both the floating toast AND the notification center
// (see NotificationCenter.jsx) pick it up. No context provider needed.

import { getPreferences } from './preferences'

const STORAGE_KEY = 'hv:notifications'
const MAX_NOTIFICATIONS = 40

let toasts = []
const toastListeners = new Set()

function notifyToasts() {
  toastListeners.forEach((listener) => listener(toasts))
}

export function showToast(message, type = 'info', durationMs = 4000) {
  // The notification center always logs the event -- Settings > Notifications
  // only controls whether it also pops up as a floating toast.
  pushNotification(message, type)

  const prefs = getPreferences()
  const toastsEnabled = type === 'error' ? prefs.toastError : prefs.toastSuccess
  if (!toastsEnabled) return null

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  toasts = [...toasts, { id, message, type }]
  notifyToasts()
  setTimeout(() => dismissToast(id), durationMs)
  return id
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  notifyToasts()
}

export function subscribeToasts(listener) {
  toastListeners.add(listener)
  listener(toasts)
  return () => toastListeners.delete(listener)
}

// ---- Notification center feed -------------------------------------------

function loadNotifications() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

let notifications = loadNotifications()
const notificationListeners = new Set()

function persistNotifications() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch {
    // ignore -- storage unavailable
  }
}

function notifyNotifications() {
  notificationListeners.forEach((listener) => listener(notifications))
}

export function pushNotification(message, type = 'info') {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  }
  notifications = [entry, ...notifications].slice(0, MAX_NOTIFICATIONS)
  persistNotifications()
  notifyNotifications()
}

export function markNotificationRead(id) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  persistNotifications()
  notifyNotifications()
}

export function markAllNotificationsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }))
  persistNotifications()
  notifyNotifications()
}

export function clearNotifications() {
  notifications = []
  persistNotifications()
  notifyNotifications()
}

export function subscribeNotifications(listener) {
  notificationListeners.add(listener)
  listener(notifications)
  return () => notificationListeners.delete(listener)
}
