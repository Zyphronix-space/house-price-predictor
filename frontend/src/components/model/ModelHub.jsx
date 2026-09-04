import { useState } from 'react'
import ModelLab from './ModelLab'
import DatasetExplorer from './DatasetExplorer'
import ErrorAnalysis from './ErrorAnalysis'
import Limitations from '../Limitations'
import './ModelHub.css'

// ModelCheck (actual-vs-predicted) lives under Analysis > Model Fit instead
// of here, alongside the residual histogram -- avoids showing the same
// chart in two different nav sections.
const SECTIONS = [
  { key: 'lab', label: 'Model Lab', Component: ModelLab },
  { key: 'dataset', label: 'Dataset', Component: DatasetExplorer },
  { key: 'errors', label: 'Error Analysis', Component: ErrorAnalysis },
]

export default function ModelHub() {
  const [section, setSection] = useState('lab')
  const Active = SECTIONS.find((s) => s.key === section).Component

  return (
    <section className="model-hub">
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
