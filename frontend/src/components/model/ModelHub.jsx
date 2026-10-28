import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/authContext'
import ModelLab from './ModelLab'
import DatasetExplorer from './DatasetExplorer'
import ErrorAnalysis from './ErrorAnalysis'
import Limitations from '../Limitations'
import './ModelHub.css'

// ModelCheck (actual-vs-predicted) lives under Analysis > Model Fit instead
// of here, alongside the residual histogram -- avoids showing the same
// chart in two different nav sections.
// The test-set error table comes from /evaluation-sample, which the API
// only serves to signed-in users; guests get an explanation instead of a
// 401 error card.
function GuestErrorAnalysis() {
  return (
    <section className="hv-card model-hub__guest">
      <p className="model-hub__guest-title">Error analysis needs a free account</p>
      <p>
        This tab lists the test-set areas where the model was furthest off. The server only shares
        it with signed-in users. The model's overall accuracy is in the Model Lab tab, no account
        needed.
      </p>
      <p className="model-hub__guest-actions">
        <Link to="/signup" state={{ from: '/model-insights' }}>Create a free account</Link>
        {' or '}
        <Link to="/login" state={{ from: '/model-insights' }}>sign in</Link>
      </p>
    </section>
  )
}

const SECTIONS = [
  { key: 'lab', label: 'Model Lab', Component: ModelLab },
  { key: 'dataset', label: 'Dataset', Component: DatasetExplorer },
  { key: 'errors', label: 'Error Analysis', Component: ErrorAnalysis },
]

export default function ModelHub() {
  const { user } = useAuth()
  const [section, setSection] = useState('lab')
  const Found = SECTIONS.find((s) => s.key === section).Component
  const Active = section === 'errors' && !user ? GuestErrorAnalysis : Found

  return (
    <section className="model-hub">
      <header className="model-hub__header">
        <h1 className="model-hub__title">How the model works</h1>
        <p className="model-hub__lede">
          HomeValue's model was built from 1990 US census records for 20,640 California neighbourhoods. It
          estimates a neighbourhood's typical (median) home value in 1990 dollars. It can't value
          an individual home or tell you today's price.
        </p>
      </header>

      <nav className="model-hub__tabs" aria-label="Model information">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`model-hub__tab ${section === s.key ? 'is-active' : ''}`}
            aria-current={section === s.key ? 'page' : undefined}
            onClick={() => setSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <Active />

      <div className="model-hub__limitations">
        <Limitations />
      </div>
    </section>
  )
}
