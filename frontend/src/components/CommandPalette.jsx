import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '../lib/hooks'
import './CommandPalette.css'

export default function CommandPalette({ setView, onLogout }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const { cycleTheme } = useTheme()

  const commands = useMemo(
    () => [
      { id: 'predict', label: 'New Prediction', hint: 'Predict', action: () => setView('predict') },
      { id: 'history', label: 'Search History', hint: 'History', action: () => setView('history') },
      { id: 'compare', label: 'Compare Properties', hint: 'Compare', action: () => setView('compare') },
      { id: 'whatif', label: 'Open What-If', hint: 'What-If', action: () => setView('whatif') },
      { id: 'investment', label: 'Investment Calculator', hint: 'Investment', action: () => setView('investment') },
      { id: 'model', label: 'Model Insights', hint: 'Insights', action: () => setView('model') },
      { id: 'dashboard', label: 'Go to Dashboard', hint: 'Dashboard', action: () => setView('dashboard') },
      { id: 'properties', label: 'Go to Properties', hint: 'Properties', action: () => setView('properties') },
      { id: 'profile', label: 'Go to Profile', hint: 'Profile', action: () => setView('profile') },
      { id: 'settings', label: 'Settings', hint: 'Settings', action: () => setView('settings') },
      { id: 'theme', label: 'Toggle Theme', hint: 'Appearance', action: () => cycleTheme() },
      { id: 'logout', label: 'Logout', hint: 'Account', action: () => onLogout() },
    ],
    [setView, cycleTheme, onLogout]
  )

  const filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
    : commands

  const close = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  const run = (cmd) => {
    if (!cmd) return
    close()
    cmd.action()
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      const isCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCombo) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  const onInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(filtered[activeIndex])
    }
  }

  return (
    <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" className="cmdk__backdrop" aria-label="Close" onClick={close} />
      <div className="hv-glass cmdk__panel">
        <div className="cmdk__input-row">
          <span className="cmdk__icon" aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="cmdk__input"
            placeholder="Type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            aria-label="Command search"
            aria-activedescendant={filtered[activeIndex] ? `cmdk-item-${filtered[activeIndex].id}` : undefined}
          />
          <kbd className="cmdk__kbd">Esc</kbd>
        </div>

        <ul className="cmdk__list" role="listbox">
          {filtered.length === 0 && <li className="cmdk__empty">No matching commands.</li>}
          {filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                id={`cmdk-item-${cmd.id}`}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                className={`cmdk__item ${i === activeIndex ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => run(cmd)}
              >
                <span>{cmd.label}</span>
                <span className="cmdk__hint">{cmd.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
