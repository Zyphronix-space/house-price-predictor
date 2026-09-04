import { useEffect, useState } from 'react'
import { dismissToast, subscribeToasts } from '../lib/toast'
import './ToastHost.css'

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-host" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`hv-card toast-host__item toast-host__item--${t.type}`}
          onClick={() => dismissToast(t.id)}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
