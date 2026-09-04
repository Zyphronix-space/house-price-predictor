import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import PropertySummary from '../valuation/PropertySummary'
import ErrorState from '../ErrorState'
import ConfirmDialog from '../ConfirmDialog'
import { addToComparison, clearComparison } from '../../lib/storage'
import { exportHistoryAsCsv, exportHistoryAsJson } from '../../lib/exportHistory'
import { showToast } from '../../lib/toast'
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
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [checkedIds, setCheckedIds] = useState(() => new Set())
  const [compareNotice, setCompareNotice] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const load = () => {
    setError(null)
    api.predictions
      .list()
      .then((res) => setEntries(res.predictions))
      .catch((err) => setError(err))
  }

  useEffect(load, [])

  const remove = async (id) => {
    try {
      await api.predictions.remove(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      if (selectedId === id) setSelectedId(null)
      setCheckedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      showToast('Prediction deleted', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const clearAll = async () => {
    setClearAllOpen(false)
    try {
      await Promise.all(entries.map((e) => api.predictions.remove(e.id)))
      setEntries([])
      setSelectedId(null)
      setCheckedIds(new Set())
      showToast('History cleared', 'success')
    } catch (err) {
      showToast(err.message, 'error')
      load()
    }
  }

  const toggleChecked = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const compareSelected = () => {
    clearComparison()
    let lastError = null
    for (const entry of entries.filter((e) => checkedIds.has(e.id))) {
      const outcome = addToComparison({ features: entry.features, predictedPriceUsd: entry.predicted_price_usd })
      if (!outcome.ok) lastError = outcome.error
    }
    if (lastError) {
      setCompareNotice(lastError)
      return
    }
    setView('compare')
  }

  if (error) return <ErrorState message={error.message} onRetry={load} />

  if (entries === null) {
    return <div className="history history--loading" aria-hidden="true" />
  }

  if (entries.length === 0) {
    return (
      <section className="history history--empty">
        <p className="hv-label">Prediction History</p>
        <p className="history__empty-copy">Your past valuations will appear here once you run one.</p>
        <button type="button" className="hv-btn hv-btn-primary" onClick={() => setView('predict')}>
          Start Valuation
        </button>
      </section>
    )
  }

  const groups = entries.reduce((acc, entry) => {
    const label = dayLabel(entry.created_at)
    ;(acc[label] ??= []).push(entry)
    return acc
  }, {})

  const selected = entries.find((e) => e.id === selectedId)

  return (
    <section className="history">
      <div className="history__header">
        <p className="hv-label">Prediction History</p>
        <div className="history__header-actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => exportHistoryAsCsv(entries)}>
            Export CSV
          </button>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => exportHistoryAsJson(entries)}>
            Export JSON
          </button>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setClearAllOpen(true)}>
            Clear history
          </button>
        </div>
      </div>

      {checkedIds.size > 0 && (
        <div className="history__compare-bar">
          <span>{checkedIds.size} selected</span>
          <button
            type="button"
            className="hv-btn hv-btn-secondary"
            onClick={compareSelected}
            disabled={checkedIds.size < 2}
          >
            Compare selected
          </button>
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setCheckedIds(new Set())}>
            Clear selection
          </button>
        </div>
      )}
      {compareNotice && <p className="history__notice">{compareNotice}</p>}

      <div className="history__layout">
        <div className="history__list">
          {Object.entries(groups).map(([label, group]) => (
            <div key={label} className="history__group">
              <p className="history__group-label">{label}</p>
              {group.map((entry) => (
                <div key={entry.id} className={`history__row ${selectedId === entry.id ? 'is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    className="history__row-checkbox"
                    checked={checkedIds.has(entry.id)}
                    onChange={() => toggleChecked(entry.id)}
                    aria-label="Select this valuation for comparison"
                  />
                  <button
                    type="button"
                    className="history__row-main"
                    onClick={() => setSelectedId(entry.id === selectedId ? null : entry.id)}
                  >
                    <span className="history__row-price">
                      ${Math.round(entry.predicted_price_usd).toLocaleString()}
                    </span>
                    <span className="history__row-time">
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="history__row-delete"
                    onClick={() => setDeleteTarget(entry)}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this prediction?"
        message="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          remove(target.id)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={clearAllOpen}
        title="Clear all history?"
        message={`This will permanently delete all ${entries.length} saved predictions.`}
        confirmLabel="Clear all"
        danger
        onConfirm={clearAll}
        onCancel={() => setClearAllOpen(false)}
      />
    </section>
  )
}
