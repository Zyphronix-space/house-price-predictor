import { useState } from 'react'
import PropertySummary from '../valuation/PropertySummary'
import { getHistory, deleteHistoryEntry, clearHistory } from '../../lib/storage'
import './History.css'

function dayLabel(iso) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function History({ setView }) {
  const [entries, setEntries] = useState(() => getHistory())
  const [selectedId, setSelectedId] = useState(null)

  const remove = (id) => {
    deleteHistoryEntry(id)
    setEntries(getHistory())
    if (selectedId === id) setSelectedId(null)
  }

  const clear = () => {
    clearHistory()
    setEntries([])
    setSelectedId(null)
  }

  if (entries.length === 0) {
    return (
      <section className="history history--empty">
        <p className="hv-label">Valuation History</p>
        <p className="history__empty-copy">Your past valuations will appear here once you run one.</p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('valuate')}>
          Start Valuation
        </button>
      </section>
    )
  }

  const groups = entries.reduce((acc, entry) => {
    const label = dayLabel(entry.timestamp)
    ;(acc[label] ??= []).push(entry)
    return acc
  }, {})

  const selected = entries.find((e) => e.id === selectedId)

  return (
    <section className="history">
      <div className="history__header">
        <p className="hv-label">Valuation History</p>
        <button type="button" className="hv-btn hv-btn-ghost" onClick={clear}>
          Clear history
        </button>
      </div>

      <div className="history__layout">
        <div className="history__list">
          {Object.entries(groups).map(([label, group]) => (
            <div key={label} className="history__group">
              <p className="history__group-label">{label}</p>
              {group.map((entry) => (
                <div key={entry.id} className={`history__row ${selectedId === entry.id ? 'is-selected' : ''}`}>
                  <button
                    type="button"
                    className="history__row-main"
                    onClick={() => setSelectedId(entry.id === selectedId ? null : entry.id)}
                  >
                    <span className="history__row-price">
                      ${Math.round(entry.predictedPriceUsd).toLocaleString()}
                    </span>
                    <span className="history__row-time">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="history__row-delete"
                    onClick={() => remove(entry.id)}
                    aria-label="Delete this valuation"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {selected && (
          <div className="history__detail">
            <PropertySummary features={selected.features} />
          </div>
        )}
      </div>
    </section>
  )
}
