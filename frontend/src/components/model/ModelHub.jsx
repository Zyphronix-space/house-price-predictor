import { useState } from 'react'
import ModelLab from './ModelLab'
import DatasetExplorer from './DatasetExplorer'
import ModelCheck from './ModelCheck'
import ErrorAnalysis from './ErrorAnalysis'
import Limitations from '../Limitations'
import './ModelHub.css'

const SECTIONS = [
  { key: 'lab', label: 'Model Lab', Component: ModelLab },
  { key: 'dataset', label: 'Dataset', Component: DatasetExplorer },
  { key: 'check', label: 'Model Check', Component: ModelCheck },
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
