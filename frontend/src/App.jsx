import { useState } from 'react'
import './App.css'

const FIELDS = [
  { name: 'MedInc', label: 'Median Income (10k USD)', placeholder: 'e.g. 8.3' },
  { name: 'HouseAge', label: 'House Age (years)', placeholder: 'e.g. 41' },
  { name: 'AveRooms', label: 'Average Rooms', placeholder: 'e.g. 6.98' },
  { name: 'AveBedrms', label: 'Average Bedrooms', placeholder: 'e.g. 1.02' },
  { name: 'Population', label: 'Block Population', placeholder: 'e.g. 322' },
  { name: 'AveOccup', label: 'Average Occupancy', placeholder: 'e.g. 2.5' },
  { name: 'Latitude', label: 'Latitude', placeholder: 'e.g. 37.88' },
  { name: 'Longitude', label: 'Longitude', placeholder: 'e.g. -122.23' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [values, setValues] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const payload = {}
    for (const field of FIELDS) {
      const num = Number(values[field.name])
      if (values[field.name] === undefined || values[field.name] === '' || Number.isNaN(num)) {
        setError(`Please enter a valid number for ${field.label}`)
        return
      }
      payload[field.name] = num
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      const data = await res.json()
      setResult(data.predicted_price_usd)
    } catch (err) {
      setError(`Could not reach the prediction API: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <h1>California House Price Predictor</h1>
      <p className="subtitle">
        Enter block-group housing stats and get a predicted median house value
        from a scikit-learn regression model trained on the California Housing dataset.
      </p>

      <form onSubmit={handleSubmit} className="form">
        {FIELDS.map((field) => (
          <label key={field.name} className="field">
            <span>{field.label}</span>
            <input
              type="number"
              step="any"
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          </label>
        ))}

        <button type="submit" disabled={loading}>
          {loading ? 'Predicting…' : 'Predict Price'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {result !== null && (
        <p className="result">
          Predicted price: <strong>${result.toLocaleString()}</strong>
        </p>
      )}
    </main>
  )
}

export default App
