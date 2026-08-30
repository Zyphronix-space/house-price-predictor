export const FEATURE_ORDER = [
  'MedInc', 'HouseAge', 'AveRooms', 'AveBedrms',
  'Population', 'AveOccup', 'Latitude', 'Longitude',
]

export const STEPS = [
  { key: 'property', title: 'Property', fields: ['MedInc', 'HouseAge'] },
  { key: 'rooms', title: 'Rooms', fields: ['AveRooms', 'AveBedrms'] },
  { key: 'occupancy', title: 'Occupancy', fields: ['Population', 'AveOccup'] },
  { key: 'location', title: 'Location', fields: ['Latitude', 'Longitude'] },
  { key: 'review', title: 'Review', fields: [] },
]

export const FIELD_META = {
  MedInc: {
    label: 'Median Income',
    unit: '$10k / household',
    explanation: 'Median household income for the surrounding block group.',
    placeholder: 'e.g. 8.3',
    example: 8.3,
  },
  HouseAge: {
    label: 'House Age',
    unit: 'years',
    explanation: 'Median age of the houses in the block group.',
    placeholder: 'e.g. 41',
    example: 41,
  },
  AveRooms: {
    label: 'Average Rooms',
    unit: 'rooms / household',
    explanation: 'Average number of rooms per household.',
    placeholder: 'e.g. 6.98',
    example: 6.98,
  },
  AveBedrms: {
    label: 'Average Bedrooms',
    unit: 'bedrooms / household',
    explanation: 'Average number of bedrooms per household.',
    placeholder: 'e.g. 1.02',
    example: 1.02,
  },
  Population: {
    label: 'Population',
    unit: 'people',
    explanation: 'Total population of the block group.',
    placeholder: 'e.g. 322',
    example: 322,
  },
  AveOccup: {
    label: 'Average Occupancy',
    unit: 'people / household',
    explanation: 'Average number of people per household.',
    placeholder: 'e.g. 2.5',
    example: 2.5,
  },
  Latitude: {
    label: 'Latitude',
    unit: 'degrees',
    explanation: 'North-south coordinate of the block group.',
    placeholder: 'e.g. 37.88',
    example: 37.88,
  },
  Longitude: {
    label: 'Longitude',
    unit: 'degrees',
    explanation: 'East-west coordinate of the block group.',
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
