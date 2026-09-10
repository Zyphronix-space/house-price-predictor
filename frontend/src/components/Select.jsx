import { useEffect, useRef, useState } from 'react'
import './Select.css'

// A themed replacement for native <select>. Browsers render the open
// native dropdown's currently-selected row with the OS accent color
// (Windows blue), which no amount of `<option>` CSS can override -- the
// only real fix is not using a native <select> where that matters visually.
// Follows the WAI-ARIA listbox pattern: button trigger + floating listbox,
// full keyboard support, click-outside to close.
export default function Select({ value, onChange, options, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)))
  const rootRef = useRef(null)
  const listRef = useRef(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = options[selectedIndex] ?? options[0]

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (open) {
      setActiveIndex(Math.max(0, selectedIndex))
      // Focus the list itself so arrow keys work immediately without a stray tab stop.
      requestAnimationFrame(() => listRef.current?.focus())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const commit = (index) => {
    const opt = options[index]
    if (opt) onChange(opt.value)
    setOpen(false)
  }

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(activeIndex)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={`hv-select ${className}`} ref={rootRef}>
      <button
        type="button"
        className="hv-input hv-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="hv-select__value">{selected?.label}</span>
        <span className="hv-select__chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="hv-select__list"
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={`hv-select-opt-${activeIndex}`}
          ref={listRef}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              id={`hv-select-opt-${i}`}
              role="option"
              aria-selected={opt.value === value}
              className={`hv-select__option ${i === activeIndex ? 'is-active' : ''} ${opt.value === value ? 'is-selected' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
