import './PropertySummary.css'

const ROWS = [
  { name: 'MedInc', title: 'Income', format: (v) => `$${Math.round(v * 10_000).toLocaleString()}` },
  { name: 'HouseAge', title: 'House age', format: (v) => `${v} years` },
  { name: 'AveRooms', title: 'Rooms', format: (v) => Number(v).toFixed(2) },
  { name: 'AveBedrms', title: 'Bedrooms', format: (v) => Number(v).toFixed(2) },
  { name: 'Population', title: 'Population', format: (v) => Number(v).toLocaleString() },
  { name: 'AveOccup', title: 'Occupancy', format: (v) => Number(v).toFixed(2) },
]

export default function PropertySummary({ features, title = 'Property summary' }) {
  return (
    <div className="hv-card property-summary">
      <p className="hv-label property-summary__title">{title}</p>
      <dl className="property-summary__grid">
        {ROWS.map(({ name, title: label, format }) => (
          <div key={name} className="property-summary__row">
            <dt>{label}</dt>
            <dd>{format(features[name])}</dd>
          </div>
        ))}
        <div className="property-summary__row property-summary__row--wide">
          <dt>Location</dt>
          <dd>
            {Number(features.Latitude).toFixed(4)}°, {Number(features.Longitude).toFixed(4)}°
          </dd>
        </div>
      </dl>
    </div>
  )
}
