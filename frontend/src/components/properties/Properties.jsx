import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'
import Modal from '../Modal'
import ConfirmDialog from '../ConfirmDialog'
import ErrorState from '../ErrorState'
import HouseForm from './HouseForm'
import './Properties.css'

const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`

export default function Properties({ setView }) {
  const [houses, setHouses] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [order, setOrder] = useState('desc')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // house being edited, or null for "add new"
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [predictingId, setPredictingId] = useState(null)

  const load = () => {
    setError(null)
    api.houses
      .list({ q, sort_by: sortBy, order })
      .then((res) => setHouses(res.houses))
      .catch((err) => setError(err))
  }

  useEffect(load, [q, sortBy, order])

  const handleCreate = async (payload) => {
    await api.houses.create(payload)
    setFormOpen(false)
    showToast('Property added', 'success')
    load()
  }

  const handleUpdate = async (payload) => {
    await api.houses.update(editing.id, payload)
    setEditing(null)
    showToast('Property updated', 'success')
    load()
  }

  const handleDelete = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await api.houses.remove(target.id)
      showToast('Property deleted', 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handlePredict = async (house) => {
    setPredictingId(house.id)
    try {
      const prediction = await api.predictions.create({ house_id: house.id })
      showToast(`${house.label}: ${fmtUsd(prediction.predicted_price_usd)}`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPredictingId(null)
    }
  }

  return (
    <section className="properties">
      <div className="properties__header">
        <p className="hv-label">Property Management</p>
        <div className="properties__header-actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setView('history')}>
            View prediction history
          </button>
          <button type="button" className="hv-btn hv-btn-primary" onClick={() => setFormOpen(true)}>
            Add property
          </button>
        </div>
      </div>

      <div className="properties__toolbar">
        <input
          className="hv-input properties__search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or notes…"
        />
        <select className="hv-input properties__select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">Date added</option>
          <option value="updated_at">Last updated</option>
          <option value="label">Name</option>
          <option value="med_inc">Median income</option>
          <option value="house_age">House age</option>
        </select>
        <select className="hv-input properties__select" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {error && <ErrorState message={error.message} onRetry={load} />}

      {!error && houses === null && (
        <div className="properties__grid" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="hv-card hv-skeleton properties__skeleton" />
          ))}
        </div>
      )}

      {!error && houses !== null && houses.length === 0 && (
        <div className="hv-card properties__empty">
          <span className="hv-empty-icon" aria-hidden="true">+</span>
          <p>{q ? 'No properties match your search.' : 'No properties saved yet — add your first one.'}</p>
          {!q && (
            <button type="button" className="hv-btn hv-btn-primary" onClick={() => setFormOpen(true)}>
              Add property
            </button>
          )}
        </div>
      )}

      {!error && houses !== null && houses.length > 0 && (
        <div className="properties__grid">
          {houses.map((house) => (
            <div key={house.id} className="hv-card properties__card">
              <p className="properties__card-label">{house.label}</p>
              {house.notes && <p className="properties__card-notes">{house.notes}</p>}
              <dl className="properties__card-facts">
                <div>
                  <dt>Median income</dt>
                  <dd>${Math.round(house.med_inc * 10_000).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>House age</dt>
                  <dd>{house.house_age} yrs</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>
                    {house.latitude.toFixed(2)}°, {house.longitude.toFixed(2)}°
                  </dd>
                </div>
              </dl>
              <div className="properties__card-actions">
                <button
                  type="button"
                  className="hv-btn hv-btn-primary properties__predict-btn"
                  onClick={() => handlePredict(house)}
                  disabled={predictingId === house.id}
                >
                  {predictingId === house.id ? 'Predicting…' : 'Predict price'}
                </button>
                <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setEditing(house)}>
                  Edit
                </button>
                <button type="button" className="hv-btn hv-btn-ghost" onClick={() => setDeleteTarget(house)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} title="Add property" onClose={() => setFormOpen(false)}>
        <HouseForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} submitLabel="Add property" />
      </Modal>

      <Modal open={!!editing} title="Edit property" onClose={() => setEditing(null)}>
        {editing && (
          <HouseForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Save changes"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this property?"
        message={deleteTarget ? `"${deleteTarget.label}" and its link to any saved predictions will be removed. Predictions themselves are kept.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}

