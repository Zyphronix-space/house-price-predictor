import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function initialsOf(user) {
  const source = user.display_name?.trim() || user.email
  return source.slice(0, 1).toUpperCase()
}

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

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

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.display_name || user.email}
      >
        {initialsOf(user)}
      </button>

      {open && (
        <div className="hv-glass user-menu__panel" role="menu">
          <p className="user-menu__identity">
            <span className="user-menu__name">{user.display_name || 'Your account'}</span>
            <span className="user-menu__email">{user.email}</span>
          </p>
          <Link to="/profile" className="user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <Link to="/settings" className="user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
