import { useEffect, useRef, useState } from 'react'
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '../lib/toast'
import { BellIcon } from './icons'
import './NotificationCenter.css'

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationCenter() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => subscribeNotifications(setItems), [])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <div className="notif" ref={rootRef}>
      <button
        type="button"
        className="notif__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notif__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="hv-glass notif__panel" role="dialog" aria-label="Notifications">
          <div className="notif__header">
            <p className="hv-label">Notifications</p>
            <div className="notif__header-actions">
              {items.length > 0 && (
                <>
                  <button type="button" className="notif__link" onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                  <button type="button" className="notif__link" onClick={clearNotifications}>
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="notif__empty">No notifications yet, actions like predictions and saved properties will show up here.</p>
          ) : (
            <ul className="notif__list">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notif__item notif__item--${n.type} ${n.read ? '' : 'is-unread'}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <span className="notif__dot" aria-hidden="true" />
                    <span className="notif__body">
                      <span className="notif__message">{n.message}</span>
                      <span className="notif__time">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
