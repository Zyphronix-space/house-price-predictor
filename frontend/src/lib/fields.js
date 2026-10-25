export const FEATURE_ORDER = [
  'MedInc', 'HouseAge', 'AveRooms', 'AveBedrms',
  'Population', 'AveOccup', 'Latitude', 'Longitude',
]

// Field groups shown as sections on a single page (not a multi-step
// wizard) -- with only 8 fields total, paginating them cost more clicks
// than it saved in clarity. Every field is a statistic for a census block
// group (a neighbourhood-sized area), not a description of one house, and
// the labels say so.
export const SECTIONS = [
  { key: 'economics', title: 'Income and housing stock', fields: ['MedInc', 'HouseAge'] },
  { key: 'home', title: 'Dwelling size', fields: ['AveRooms', 'AveBedrms'] },
  { key: 'neighborhood', title: 'Population', fields: ['Population', 'AveOccup'] },
  { key: 'location', title: 'Location', fields: ['Latitude', 'Longitude'] },
]

export const FIELD_META = {
  MedInc: {
    label: 'Median household income',
    unit: '× $10,000',
    explanation: 'Block group median, in tens of thousands of 1990 dollars (8.3 = $83,000).',
    placeholder: 'e.g. 8.3',
    example: 8.3,
  },
  HouseAge: {
    label: 'Median house age',
    unit: 'years',
    explanation: 'Median age of the homes in the block group.',
    placeholder: 'e.g. 41',
    example: 41,
  },
  AveRooms: {
    label: 'Rooms per household',
    unit: 'rooms',
    explanation: 'Average number of rooms per household.',
    placeholder: 'e.g. 6.98',
    example: 6.98,
  },
  AveBedrms: {
    label: 'Bedrooms per household',
    unit: 'bedrooms',
    explanation: 'Average number of bedrooms per household.',
    placeholder: 'e.g. 1.02',
    example: 1.02,
  },
  Population: {
    label: 'Block group population',
    unit: 'people',
    explanation: 'Total number of residents in the block group.',
    placeholder: 'e.g. 322',
    example: 322,
  },
  AveOccup: {
    label: 'People per household',
    unit: 'people',
    explanation: 'Average household size.',
    placeholder: 'e.g. 2.5',
    example: 2.5,
  },
  Latitude: {
    label: 'Latitude',
    unit: '°N',
    explanation: 'North-south position of the block group.',
    placeholder: 'e.g. 37.88',
    example: 37.88,
  },
  Longitude: {
    label: 'Longitude',
    unit: '°',
    explanation: 'East-west position; negative in California.',
    placeholder: 'e.g. -122.23',
    example: -122.23,
  },
}

// Real min/p1/p99/max computed from sklearn's California Housing dataset
// (fetch_california_housing()), used only as a fallback while /dataset-stats
// hasn't loaded yet. The backend and DatasetExplorer/ModelCheck pages read
// the live values from ml/dataset_stats.json via the API.
export const FALLBACK_RANGES = {
  MedInc: { min: 0.5, p1: 1.07, p99: 10.597, max: 15 },
  HouseAge: { min: 1, p1: 4, p99: 52, max: 52 },
  AveRooms: { min: 0.846, p1: 2.581, p99: 10.357, max: 141.909 },
  AveBedrms: { min: 0.333, p1: 0.873, p99: 2.128, max: 34.067 },
  Population: { min: 3, p1: 88, p99: 5805.83, max: 35682 },
  AveOccup: { min: 0.692, p1: 1.537, p99: 5.395, max: 1243.333 },
  Latitude: { min: 32.54, p1: 32.68, p99: 40.626, max: 41.95 },
  Longitude: { min: -124.35, p1: -123.22, p99: -116.29, max: -114.31 },
}

export const EXAMPLE_PROPERTY = Object.fromEntries(
  FEATURE_ORDER.map((name) => [name, FIELD_META[name].example])
)
